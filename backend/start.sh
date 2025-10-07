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

# Try to setup database schema and seed data
echo "Testing database connections..."

# Test internal connection first
export DATABASE_URL_INTERNAL="postgresql://postgres:K8A1EuplrcGvVwi577BihGvTkKXbWhe6WDA5OJY6sE7XGd4GXCmdaeUTNddPpNRl@hgwks4o884cgo8wo8ok84ock:5432/postgres"
export DATABASE_URL_PUBLIC="postgresql://postgres:K8A1EuplrcGvVwi577BihGvTkKXbWhe6WDA5OJY6sE7XGd4GXCmdaeUTNddPpNRl@31.97.70.246:5432/postgres"

# Try internal connection first
if DATABASE_URL="$DATABASE_URL_INTERNAL" npx prisma db push --accept-data-loss --skip-generate > /dev/null 2>&1; then
    echo "✅ Database connected via internal URL!"
    export DATABASE_URL="$DATABASE_URL_INTERNAL"
elif DATABASE_URL="$DATABASE_URL_PUBLIC" npx prisma db push --accept-data-loss --skip-generate > /dev/null 2>&1; then
    echo "✅ Database connected via public URL!"
    export DATABASE_URL="$DATABASE_URL_PUBLIC"
else
    echo "⚠️ Both database connections failed - will retry during app startup"
    # Keep the original DATABASE_URL from environment
fi

# If we have a working connection, seed the admin user
if [ ! -z "$DATABASE_URL" ]; then
    echo "Seeding initial admin user..."
    if node -e "
        const { PrismaClient } = require('@prisma/client');
        const bcrypt = require('bcrypt');
        const prisma = new PrismaClient();
        
        async function seed() {
            try {
                const hashedPassword = await bcrypt.hash('admin123', 12);
                await prisma.user.upsert({
                    where: { email: 'admin@bank.com' },
                    update: {},
                    create: {
                        email: 'admin@bank.com',
                        password: hashedPassword,
                        firstName: 'Admin',
                        lastName: 'User',
                        role: 'ADMIN',
                        isActive: true
                    }
                });
                console.log('✅ Admin user created: admin@bank.com / admin123');
            } catch (error) {
                console.log('⚠️ Admin user seeding failed:', error.message);
            }
        }
        
        seed().finally(() => prisma.\$disconnect());
    " 2>/dev/null; then
        echo "✅ Admin user seeded successfully!"
    else
        echo "⚠️ Failed to seed admin user - will be created on first login attempt"
    fi
fi

# Start the application
echo "Starting NestJS application on port $PORT..."
exec npm run start:prod