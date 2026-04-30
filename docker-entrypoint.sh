#!/bin/sh
set -e

echo "Waiting for Postgres on host 'postgres:5432'..."
RETRIES=0
MAX=60
until nc -z postgres 5432; do
  RETRIES=$((RETRIES+1))
  if [ $RETRIES -ge $MAX ]; then
    echo "Postgres did not become available after $MAX seconds"
    break
  fi
  echo "Postgres unavailable, sleeping 1s... ($RETRIES/$MAX)"
  sleep 1
done

echo "Attempting to run migrations using drizzle.config.ts"
if command -v npx >/dev/null 2>&1; then
  set +e
  npx drizzle-kit push --config drizzle.config.ts 2>&1
  RC=$?
  set -e
  if [ $RC -ne 0 ]; then
    echo "drizzle-kit push exited with code $RC"
  else
    echo "Migrations applied successfully"
  fi
else
  echo "npx not found; skipping migrations"
fi

echo "Starting app..."
exec node dist/main.js
