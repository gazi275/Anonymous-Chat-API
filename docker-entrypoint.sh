#!/bin/sh
set -e

echo "Waiting for Postgres and running migrations..."

# Give Postgres extra time to be fully ready
sleep 3

# Run migrations with better error output
echo "Running migrations..."
npx drizzle-kit push --config drizzle.config.js 2>&1 || {
  echo "Migration failed, but continuing startup..."
}

echo "Starting app..."
exec node dist/main.js
