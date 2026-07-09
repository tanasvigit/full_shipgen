$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$AndroidDir = Join-Path $Root "android"
$AppDir = Join-Path $AndroidDir "app"
$KeyProperties = Join-Path $AndroidDir "key.properties"
$Keystore = Join-Path $AppDir "upload-keystore.jks"

function Get-JavaHome {
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
        return $env:JAVA_HOME
    }
    $candidates = @(
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files\Java\jdk-17"
    )
    foreach ($home in $candidates) {
        if (Test-Path (Join-Path $home "bin\java.exe")) {
            return $home
        }
    }
    return $null
}

if (-not (Test-Path $KeyProperties) -or -not (Test-Path $Keystore)) {
    Write-Host "Release keystore missing. Run: npm run android:release:aab (creates signing files first)"
    throw "Missing android/key.properties or android/app/upload-keystore.jks"
}

$javaHome = Get-JavaHome
if (-not $javaHome) {
    throw "JAVA_HOME not found. Install JDK 17+ or Android Studio."
}
$env:JAVA_HOME = $javaHome

Push-Location $AndroidDir
try {
    Write-Host "Building signed release APK..."
    & .\gradlew.bat assembleRelease
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle assembleRelease failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

$Apk = Join-Path $AppDir "build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $Apk)) {
    throw "APK not found at expected path: $Apk"
}

$OutDir = Join-Path $Root "dist"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$OutApk = Join-Path $OutDir "shipgen-mobile-$Stamp.apk"
Copy-Item $Apk $OutApk -Force

Write-Host ""
Write-Host "Signed APK ready:"
Write-Host "  $OutApk"
Write-Host "  $Apk"
