#!/bin/sh

# Exit the script as soon as a command fails
set -e

echo "[deploy] Starting application deployment tasks..."

# Deployment controls (override via environment variables in CI/Helm secrets)
# DEPLOY_CREATE_DB=true|false
# DEPLOY_RUN_SEED=never|always
# DEPLOY_RUN_PERMISSIONS_SYNC=true|false
# DEPLOY_RUN_REGISTRY_INIT=true|false
DEPLOY_CREATE_DB="${DEPLOY_CREATE_DB:-true}"
DEPLOY_RUN_SEED="${DEPLOY_RUN_SEED:-never}"
DEPLOY_RUN_PERMISSIONS_SYNC="${DEPLOY_RUN_PERMISSIONS_SYNC:-true}"
DEPLOY_RUN_REGISTRY_INIT="${DEPLOY_RUN_REGISTRY_INIT:-true}"

# Create mysql databases if missing (safe/idempotent)
if [ "$DEPLOY_CREATE_DB" = "true" ]; then
  echo "[deploy] Ensuring databases exist..."
  php artisan mysql:createdb
else
  echo "[deploy] Skipping database creation (DEPLOY_CREATE_DB=$DEPLOY_CREATE_DB)."
fi

# Run migrations
echo "[deploy] Running primary migrations..."
php artisan migrate --force

# Run migrations for sandbox too
echo "[deploy] Running sandbox migrations..."
php artisan sandbox:migrate --force

# Seed strategy
case "$DEPLOY_RUN_SEED" in
  always)
    echo "[deploy] Seeding database..."
    php artisan fleetbase:seed --force
    ;;
  never)
    echo "[deploy] Skipping seed (DEPLOY_RUN_SEED=never)."
    ;;
  *)
    echo "[deploy] Unknown DEPLOY_RUN_SEED='$DEPLOY_RUN_SEED'. Expected never|always."
    exit 1
    ;;
esac

# Create permissions, policies, and roles
if [ "$DEPLOY_RUN_PERMISSIONS_SYNC" = "true" ]; then
  echo "[deploy] Syncing permissions and roles..."
  php artisan fleetbase:create-permissions
else
  echo "[deploy] Skipping permissions sync."
fi

# Restart queue
echo "[deploy] Restarting queue workers..."
php artisan queue:restart

# Sync scheduler
echo "[deploy] Syncing scheduler monitor..."
php artisan schedule-monitor:sync

# Clear cache
echo "[deploy] Clearing and rebuilding caches..."
php artisan cache:clear
php artisan route:clear

# Optimize
php artisan config:cache
php artisan route:cache

# Initialize registry
if [ "$DEPLOY_RUN_REGISTRY_INIT" = "true" ]; then
  echo "[deploy] Initializing registry..."
  php artisan registry:init
else
  echo "[deploy] Skipping registry initialization."
fi

# Restart octane
# php artisan octane:reload
echo "[deploy] Deployment tasks completed."
