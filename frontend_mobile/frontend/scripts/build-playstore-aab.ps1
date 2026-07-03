$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$AndroidDir = Join-Path $Root "android"
$AppDir = Join-Path $AndroidDir "app"
$KeyProperties = Join-Path $AndroidDir "key.properties"
$Keystore = Join-Path $AppDir "upload-keystore.jks"
$CredentialsFile = Join-Path $AndroidDir "keystore.credentials"

function Get-JavaKeytool {
    if ($env:JAVA_HOME) {
        $candidate = Join-Path $env:JAVA_HOME "bin\keytool.exe"
        if (Test-Path $candidate) { return $candidate }
    }
    $commonHomes = @(
        "C:\Program Files\Java\jdk-17",
        "C:\Program Files\Android\Android Studio\jbr"
    )
    foreach ($home in $commonHomes) {
        $candidate = Join-Path $home "bin\keytool.exe"
        if (Test-Path $candidate) {
            if (-not $env:JAVA_HOME) {
                $env:JAVA_HOME = $home
            }
            return $candidate
        }
    }
    return (Get-Command keytool -ErrorAction SilentlyContinue).Source
}

if (-not (Test-Path $KeyProperties) -or -not (Test-Path $Keystore)) {
    $keytool = Get-JavaKeytool
    if (-not $keytool) {
        throw "keytool not found. Install JDK 17+ and set JAVA_HOME."
    }

    $storePassword = $env:ANDROID_KEYSTORE_PASSWORD
    $keyPassword = $env:ANDROID_KEY_PASSWORD
    if (-not $storePassword) {
        $storePassword = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
    }
    if (-not $keyPassword) {
        $keyPassword = $storePassword
    }

    Write-Host "Creating Play Store upload keystore at $Keystore"
    & $keytool -genkeypair -v `
        -storetype PKCS12 `
        -keystore $Keystore `
        -alias upload `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $storePassword `
        -keypass $keyPassword `
        -dname "CN=ShipGen Mobile, OU=Mobile, O=ShipGen, L=NA, ST=NA, C=US"

    @"
storePassword=$storePassword
keyPassword=$keyPassword
keyAlias=upload
storeFile=upload-keystore.jks
"@ | Set-Content -Path $KeyProperties -Encoding ASCII

    @"
# BACK UP THESE CREDENTIALS AND upload-keystore.jks SECURELY.
# Play Console requires the same upload key for all future releases.
storePassword=$storePassword
keyPassword=$keyPassword
keyAlias=upload
keystorePath=$Keystore
generatedAt=$(Get-Date -Format o)
"@ | Set-Content -Path $CredentialsFile -Encoding UTF8

    Write-Host ""
    Write-Host "Saved signing credentials to: $CredentialsFile"
    Write-Host "Back up upload-keystore.jks and keystore.credentials before deploying."
}

Push-Location $AndroidDir
try {
    if (-not $env:JAVA_HOME) {
        $detected = Get-JavaKeytool
        if ($detected) {
            $env:JAVA_HOME = Split-Path (Split-Path $detected -Parent) -Parent
        }
    }
    Write-Host "Building signed release AAB..."
    & .\gradlew.bat bundleRelease
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle bundleRelease failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

$Aab = Join-Path $AppDir "build\outputs\bundle\release\app-release.aab"
if (-not (Test-Path $Aab)) {
    throw "AAB not found at expected path: $Aab"
}

$OutDir = Join-Path $Root "dist"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OutAab = Join-Path $OutDir "shipgen-mobile-$Stamp.aab"
Copy-Item $Aab $OutAab -Force

Write-Host ""
Write-Host "Signed AAB ready:"
Write-Host "  $OutAab"
Write-Host "  $Aab"
Write-Host ""
Write-Host "BACKUP for future releases (see docs/PLAYSTORE_SIGNING.md):"
Write-Host "  $Keystore"
Write-Host "  $KeyProperties"
Write-Host "  $CredentialsFile"
Write-Host "  Save keystore password, key alias (upload), and key password to a password manager."
