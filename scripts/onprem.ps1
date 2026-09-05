# On-prem Fleetbase: build API from packages/ and start Docker stack.
param(
    [switch]$BuildOnly,
    [switch]$NoBuild
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "Checking runtime paths for fleetbase.io..." -ForegroundColor Cyan
& "$Root\scripts\check-no-fleetbase-io-runtime.ps1"

if (-not $NoBuild) {
    Write-Host "Building API image (fleetbase-api-onprem:local) - first run can take 20+ minutes..." -ForegroundColor Cyan
    docker compose build application
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if ($BuildOnly) {
    Write-Host "Build complete." -ForegroundColor Green
    exit 0
}

Write-Host "Starting services..." -ForegroundColor Cyan
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "On-prem stack is up." -ForegroundColor Green
Write-Host "  API:     http://localhost:8000"
Write-Host "  Console: http://localhost:4200"
Write-Host "  React:   cd frontend; npm run dev  -> http://localhost:5173"
Write-Host ""
Write-Host "Fresh DB: clear docker/database/mysql, then run: powershell -File scripts/migrate-docker.ps1"
Write-Host "Routing:  powershell -File scripts/setup-osrm.ps1  (once), then osrm services start with compose"
Write-Host "Docs: docs/ON-PREM-PACKAGES-NO-FLEETBASE-IO.md"
