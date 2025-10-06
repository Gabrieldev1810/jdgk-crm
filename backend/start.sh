#!/bin/sh
set -e

echo "Starting Dial-Craft Backend..."

# Print environment info for debugging
echo "Node Environment: $NODE_ENV"
echo "Database URL: $DATABASE_URL"
echo "Port: $PORT"

# Test basic connectivity to database host first
echo "Testing database host connectivity..."
DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
echo "Database Host: $DB_HOST"
echo "Database Port: $DB_PORT"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "Connection attempt $attempt/$max_attempts..."
    
    # Try to connect with psql if available, otherwise use prisma
    if command -v pg_isready >/dev/null 2>&1; then
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
            echo "✅ PostgreSQL server is ready!"
            break
        fi
    else
        # Fallback to prisma db push test
        if npx prisma db push --accept-data-loss --skip-generate > /dev/null 2>&1; then
            echo "✅ PostgreSQL connection successful via Prisma!"
            break
        fi
    fi
    
    echo "❌ PostgreSQL not ready, retrying in 5 seconds..."
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Failed to connect to PostgreSQL after $max_attempts attempts"
        echo "Attempting to start application anyway..."
        break
    fi
    sleep 5
    attempt=$((attempt + 1))
done

# Regenerate Prisma client to ensure compatibility
echo "Regenerating Prisma client..."
npx prisma generate

# Apply database schema
echo "Applying database schema..."
npx prisma db push --accept-data-loss --skip-generate

# Start the application
echo "Starting NestJS application on port $PORT..."
exec npm run start:prod