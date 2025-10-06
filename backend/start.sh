#!/bin/sh
set -e

echo "Starting Dial-Craft Backend..."

# Wait for PostgreSQL to be available
echo "Waiting for PostgreSQL to be ready..."
until npx prisma db push --accept-data-loss > /dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is ready!"

# Ensure database schema is up to date
echo "Deploying database migrations..."
npx prisma migrate deploy || {
    echo "Migration deploy failed, trying to push schema..."
    npx prisma db push --accept-data-loss || {
        echo "Schema push failed, continuing with existing schema..."
    }
}

# Regenerate Prisma client to ensure compatibility
echo "Regenerating Prisma client..."
npx prisma generate

# Optionally seed the database if needed
echo "Checking if database needs seeding..."
npx prisma db seed || echo "Seeding skipped or failed, continuing..."

# Start the application
echo "Starting NestJS application..."
exec npm run start:prod