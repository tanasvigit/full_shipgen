# Run database migrations inside the Docker application container (SaaS / on-prem standard).
param(
    [switch]$Seed,
    [switch]$SkipCreateDb
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$service = "application"
$running = docker compose ps --services --status running 2>$null
if ($running -notmatch $service) {
    Write-Host "Starting Docker stack..." -ForegroundColor Cyan
    docker compose up -d database cache $service
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$commands = @()
if (-not $SkipCreateDb) {
    $commands += "php artisan mysql:createdb"
}
$commands += @(
    "php artisan migrate --force",
    "php artisan sandbox:migrate --force"
)
if ($Seed) {
    $commands += "php artisan fleetbase:seed --force"
}
$commands += @(
    "php artisan fleetbase:create-permissions",
    "php artisan cache:clear",
    "php artisan octane:reload"
)

$script = ($commands | ForEach-Object { "cd /fleetbase/api && $_" }) -join " && "
Write-Host "Running migrations in container '$service'..." -ForegroundColor Cyan
docker compose exec $service sh -c $script
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Migrations complete." -ForegroundColor Green
