#!/bin/sh
set -e

echo "Starting Dial-Craft Backend..."

# Ensure database exists and is up to date
echo "Checking database schema..."
npx prisma migrate deploy || {
    echo "Migration failed, trying to push schema..."
    npx prisma db push --accept-data-loss || echo "Schema push failed, continuing with existing database"
}

# Start the application
echo "Starting NestJS application..."
exec npm run start:prod