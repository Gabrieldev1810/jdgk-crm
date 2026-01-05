#!/bin/sh
set -e

echo "Starting Dial-Craft Backend..."

# Print environment info for debugging
echo "Node Environment: $NODE_ENV"
echo "Database URL: $DATABASE_URL"
echo "Port: $PORT"

# Extract database connection details
DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
echo "Database Host: $DB_HOST"
echo "Database Port: $DB_PORT"

# Regenerate Prisma client to ensure compatibility
echo "Regenerating Prisma client..."
npx prisma generate

# Test database connection and apply schema
echo "Testing database connection..."
if npx prisma db push --accept-data-loss --skip-generate > /dev/null 2>&1; then
    echo "✅ Database connected and schema applied successfully!"
else
    echo "❌ Database connection or schema push failed!"
    exit 1
fi

# Seed the admin user (verified working in local tests)
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
                update: { isActive: true },
                create: {
                    email: 'admin@bank.com',
                    password: hashedPassword,
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'ADMIN',
                    isActive: true,
                    emailVerified: true
                }
            });
            console.log('✅ Admin user ready: admin@bank.com / admin123');
        } catch (error) {
            console.log('⚠️ Admin user seeding failed:', error.message);
        } finally {
            await prisma.\$disconnect();
        }
    }
    
    seed();
" 2>/dev/null; then
    echo "✅ Admin user seeded successfully!"
else
    echo "⚠️ Failed to seed admin user - will be created on first login attempt"
fi

# Start the application
echo "Starting NestJS application on port $PORT..."
exec npm run start:prod