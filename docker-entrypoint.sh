#!/bin/sh
set -e

# Retry logic for waiting and running migrations
MAX_RETRIES=30
RETRY_COUNT=0

echo "Waiting for Postgres and running migrations..."

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if npx drizzle-kit push --config drizzle.config.ts 2>/dev/null; then
    echo "Migrations successful!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "Postgres not ready or migrations failed. Retrying... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 1
  fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Failed to run migrations after $MAX_RETRIES attempts"
fi

echo "Starting app..."
exec node dist/main.js
