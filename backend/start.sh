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

# Regenerate Prisma client to ensure compatibility
echo "Regenerating Prisma client..."
npx prisma generate

echo "Testing basic network connectivity to database host..."
if command -v ping >/dev/null 2>&1; then
    if ping -c 1 "$DB_HOST" >/dev/null 2>&1; then
        echo "✅ Can reach database host: $DB_HOST"
    else
        echo "❌ Cannot reach database host: $DB_HOST"
    fi
fi

# Try to apply database schema with limited retries
echo "Attempting to apply database schema..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "Schema attempt $attempt/$max_attempts..."
    
    if npx prisma db push --accept-data-loss --skip-generate > /dev/null 2>&1; then
        echo "✅ Database schema applied successfully!"
        break
    else
        echo "❌ Schema application failed, retrying in 3 seconds..."
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ Failed to apply schema after $max_attempts attempts"
            echo "Starting application anyway - it will handle database connections internally..."
            break
        fi
        sleep 3
        attempt=$((attempt + 1))
    fi
done

# Start the application
echo "Starting NestJS application on port $PORT..."
exec npm run start:prod