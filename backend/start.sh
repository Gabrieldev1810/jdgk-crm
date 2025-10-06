#!/bin/sh
set -e

echo "Starting Dial-Craft Backend..."

# Print database connection info for debugging
echo "Database URL: $DATABASE_URL"

# Simple database connection test with timeout
echo "Testing database connection..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "Connection attempt $attempt/$max_attempts..."
    
    if npx prisma db push --accept-data-loss --skip-generate > /dev/null 2>&1; then
        echo "✅ PostgreSQL connection successful!"
        break
    else
        echo "❌ PostgreSQL connection failed, retrying in 3 seconds..."
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ Failed to connect to PostgreSQL after $max_attempts attempts"
            echo "Starting application anyway (it will retry internally)..."
            break
        fi
        sleep 3
        attempt=$((attempt + 1))
    fi
done

# Regenerate Prisma client to ensure compatibility
echo "Regenerating Prisma client..."
npx prisma generate

# Start the application
echo "Starting NestJS application..."
exec npm run start:prod