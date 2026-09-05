# Start (or switch) the stack with Vite hot-reload frontend — no UI image rebuilds.
# Usage: powershell -File scripts/dev-ui.ps1
param(
    [switch]$Build
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$composeArgs = @("-f", "docker-compose.yml", "-f", "docker-compose.dev.yml")

Write-Host "Starting stack with Vite HMR frontend (bind mounts)..." -ForegroundColor Cyan
if ($Build) {
    docker compose @composeArgs up -d --build frontend
} else {
    # Recreate frontend so override ports/volumes apply; other services stay up.
    docker compose @composeArgs up -d --no-deps --force-recreate frontend
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Frontend recreate failed — bringing full stack up..." -ForegroundColor Yellow
        docker compose @composeArgs up -d
    }
}

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Dev UI is starting (first boot may take 1-2 min for Vite)." -ForegroundColor Green
Write-Host "  UI:  http://localhost:5173"
Write-Host "  API: http://localhost:8000"
Write-Host ""
Write-Host "Edit frontend/, yms/frontend_1/, or Parking management/frontend/ — browser refreshes automatically."
Write-Host "Rebuild UI image only when package.json deps change:  powershell -File scripts/dev-ui.ps1 -Build"
