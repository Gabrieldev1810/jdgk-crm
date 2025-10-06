#!/bin/sh
set -e

echo "Starting Dial-Craft Backend..."

# Ensure prisma directory has proper permissions
echo "Setting up database directory..."
mkdir -p /app/prisma
chmod 755 /app/prisma

# Check if database file exists
if [ ! -f "/app/prisma/dev.db" ]; then
    echo "Database file not found, initializing new database..."
    # Create empty database file
    touch /app/prisma/dev.db
    chmod 644 /app/prisma/dev.db
fi

# Ensure database schema is up to date
echo "Checking database schema..."
npx prisma migrate deploy || {
    echo "Migration deploy failed, trying to push schema..."
    npx prisma db push --accept-data-loss || {
        echo "Schema push failed, creating database from scratch..."
        npx prisma migrate reset --force --skip-seed || echo "Reset failed, continuing..."
    }
}

# Optionally seed the database if needed
echo "Checking if database needs seeding..."
npx prisma db seed || echo "Seeding skipped or failed, continuing..."

# Start the application
echo "Starting NestJS application..."
exec npm run start:prod