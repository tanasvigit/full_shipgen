# Refresh all API microservice containers with latest packages/* code.
# Usage: .\scripts\refresh-microservices.ps1 [-Rebuild]
# UI: run separately — cd frontend && npm run dev

param(
    [switch]$Rebuild
)

Set-Location $PSScriptRoot\..
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"

$services = @(
    "fleetbase-application-1",
    "fleetbase-iam-service-1",
    "fleetbase-fleetops-service-1",
    "fleetbase-pallet-service-1",
    "fleetbase-ledger-service-1",
    "fleetbase-storefront-service-1"
)

# Reinstall path packages from packages/* (do not rm vendor alone — leaves IAM/FleetOps broken mid-update).
$composerCmd = @"
composer update fleetbase/core-api fleetbase/fleetops-api fleetbase/pallet-api \
  fleetbase/storefront-api fleetbase/ledger-api fleetbase/registry-bridge \
  --no-scripts -q && \
php artisan route:clear && php artisan config:clear
"@

Write-Host "==> Ensuring stack is up..."
docker compose up -d database cache socket tiles gateway iam-service fleetops-service pallet-service ledger-service storefront-service application httpd 2>&1 | Out-Host

if ($Rebuild) {
    Write-Host "==> Rebuilding API image..."
    docker compose build application 2>&1 | Out-Host
}

Write-Host "==> Rebuilding gateway (nginx routes)..."
docker compose build gateway 2>&1 | Out-Host

foreach ($name in $services) {
    $running = docker ps --filter "name=$name" --format "{{.Names}}" 2>$null
    if (-not $running) {
        Write-Host "    skip $name (not running)"
        continue
    }
    Write-Host "==> Refreshing vendor in $name ..."
    docker exec -w /fleetbase/api $name sh -c $composerCmd 2>&1 | Out-Host
}

Write-Host "==> Restarting API + gateway..."
docker compose restart gateway iam-service fleetops-service pallet-service ledger-service storefront-service application 2>&1 | Out-Host

docker compose up -d --force-recreate gateway 2>&1 | Out-Host

Start-Sleep -Seconds 12

Write-Host ""
Write-Host "==> Health checks"
foreach ($url in @("http://localhost:8000/health")) {
    try {
        $code = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15).StatusCode
        Write-Host "  OK $code $url"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "  ?? $code $url"
    }
}

Write-Host ""
Write-Host "==> Route smoke (first match per domain)"
$checks = @(
    @{ Container = "fleetbase-iam-service-1"; Path = "int/v1/auth/login" },
    @{ Container = "fleetbase-fleetops-service-1"; Path = "int/v1/fleet-ops/live/orders" },
    @{ Container = "fleetbase-pallet-service-1"; Path = "pallet/int/v1/warehouses" },
    @{ Container = "fleetbase-ledger-service-1"; Path = "ledger/int/v1/invoices" },
    @{ Container = "fleetbase-storefront-service-1"; Path = "storefront/int/v1/networks" },
    @{ Container = "fleetbase-application-1"; Path = "registry" }
)
foreach ($c in $checks) {
    $out = docker exec $c.Container php artisan route:list --path=$($c.Path) 2>&1 | Out-String
    if ($out -match "doesn't have any routes") {
        Write-Host "  FAIL $($c.Container) $($c.Path)"
    } elseif ($out -match "GET|HEAD|POST|PUT|PATCH|DELETE") {
        Write-Host "  OK   $($c.Container) $($c.Path)"
    } else {
        Write-Host "  ??   $($c.Container) $($c.Path)"
    }
}

Write-Host ""
Write-Host ""
Write-Host "Done. API: http://localhost:8000  UI: cd frontend; npm run dev -> http://localhost:5173"
$ErrorActionPreference = $prevEap
