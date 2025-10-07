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

# Network debugging
echo "=== NETWORK DEBUGGING ==="
echo "Container IP configuration:"
ip addr show | grep inet || echo "ip command not available"
echo "DNS resolution test:"
nslookup postgresql-database-hgwks4o884cgo8wo8ok84ock || echo "nslookup failed"
echo "Network connectivity test:"
ping -c 1 postgresql-database-hgwks4o884cgo8wo8ok84ock || echo "ping failed"
echo "Port connectivity test:"
nc -zv postgresql-database-hgwks4o884cgo8wo8ok84ock 5432 || echo "nc failed - port not reachable"
echo "=========================="

# Skip database setup for now - let NestJS handle it
echo "Skipping database setup - NestJS will handle connections internally"
echo "Database schema will be applied when connection is available"

# Start the application
echo "Starting NestJS application on port $PORT..."
exec npm run start:prod