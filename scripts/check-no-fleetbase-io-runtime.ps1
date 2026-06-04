# Fail CI/local checks if cloud Fleetbase defaults appear in runtime paths.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$blockedPatterns = @(
    "fleetbase\.io",
    "flb-assets",
    "basemaps\.cartocdn",
    "tiles\.stadiamaps"
)

$scanPaths = @(
    @{ Path = "packages"; Globs = @("*.php", "*.js", "*.hbs") },
    @{ Path = "api\config"; Globs = @("*.php") },
    @{ Path = "api\app"; Globs = @("*.php") },
    @{ Path = "frontend\src"; Globs = @("*.js", "*.jsx") },
    @{ Path = "docker-compose.yml"; Globs = $null }
)

$excludeSubstrings = @(
    "\composer.json",
    "\package.json",
    "\extension.json",
    "no fleetbase.io",
    "not fleetbase.io",
    "// return static::attributeFromCache",
    "docs\"
)

$hits = @()
foreach ($scan in $scanPaths) {
    $base = Join-Path $root $scan.Path
    if (-not (Test-Path $base)) { continue }

    $files = @()
    if ($scan.Globs) {
        foreach ($glob in $scan.Globs) {
            $files += Get-ChildItem -Path $base -Recurse -Filter $glob -File -ErrorAction SilentlyContinue
        }
    } else {
        $files = @(Get-Item $base -ErrorAction SilentlyContinue)
    }

    foreach ($f in ($files | Sort-Object FullName -Unique)) {
        $skip = $false
        foreach ($ex in $excludeSubstrings) {
            if ($f.FullName -like "*$ex*") { $skip = $true; break }
        }
        if ($skip) { continue }

        foreach ($pattern in $blockedPatterns) {
            $m = Select-String -Path $f.FullName -Pattern $pattern -ErrorAction SilentlyContinue
            foreach ($match in $m) {
                $line = $match.Line.Trim()
                if ($line -match 'no fleetbase\.io|not fleetbase\.io|// return static::attributeFromCache') { continue }
                if ($line -match '^\*|^//|^\s*#') { continue }
                $hits += $match
            }
        }
    }
}

if ($hits.Count -gt 0) {
    Write-Host "Blocked external defaults found in runtime paths:" -ForegroundColor Red
    $hits | ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }
    exit 1
}

Write-Host "OK: no fleetbase.io / flb-assets / Carto / Stadia in scanned runtime paths." -ForegroundColor Green
exit 0
