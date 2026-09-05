#!/bin/sh
set -e
cd /workspace/frontend

# Named volume for node_modules may be empty on first start after image rebuild.
if [ ! -f node_modules/vite/package.json ]; then
  echo "Installing frontend dependencies (node_modules volume)..."
  npm ci
fi

exec npm run dev -- --host 0.0.0.0 --port 5173
