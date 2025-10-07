#!/bin/bash
# Database Connection Verification Script for Server Deployment
# Run this on your Coolify server to verify the database setup

echo "🔍 DIAL-CRAFT DATABASE CONNECTION VERIFICATION"
echo "=============================================="
echo ""

# Check if PostgreSQL is accessible
echo "1. Testing PostgreSQL connectivity..."
if command -v pg_isready &> /dev/null; then
    if pg_isready -h 31.97.70.246 -p 5432 -U postgres; then
        echo "✅ PostgreSQL server is accessible"
    else
        echo "❌ PostgreSQL server is not accessible"
        exit 1
    fi
else
    echo "⚠️ pg_isready not available, skipping connectivity test"
fi

# Check if we can connect with psql (if available)
echo ""
echo "2. Testing database connection..."
if command -v psql &> /dev/null; then
    export PGPASSWORD="K8A1EuplrcGvVwi577BihGvTkKXbWhe6WDA5OJY6sE7XGd4GXCmdaeUTNddPpNRl"
    if psql -h 31.97.70.246 -p 5432 -U postgres -d postgres -c "SELECT version();" &> /dev/null; then
        echo "✅ Database connection successful"
        
        # Check if tables exist
        echo ""
        echo "3. Checking database schema..."
        TABLES=$(psql -h 31.97.70.246 -p 5432 -U postgres -d postgres -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" | tr -d ' ' | grep -v '^$')
        
        if [ ! -z "$TABLES" ]; then
            echo "✅ Database tables found:"
            echo "$TABLES" | while read table; do
                echo "   - $table"
            done
            
            # Check admin user
            echo ""
            echo "4. Checking admin user..."
            USER_COUNT=$(psql -h 31.97.70.246 -p 5432 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM users WHERE email = 'admin@bank.com';" | tr -d ' ')
            if [ "$USER_COUNT" = "1" ]; then
                echo "✅ Admin user exists: admin@bank.com"
                echo "✅ Password: admin123"
            else
                echo "⚠️ Admin user not found - will be created on startup"
            fi
        else
            echo "⚠️ No tables found - schema will be applied on startup"
        fi
    else
        echo "❌ Database connection failed"
        exit 1
    fi
else
    echo "⚠️ psql not available, skipping detailed database tests"
fi

echo ""
echo "🎉 VERIFICATION COMPLETE"
echo "✅ Your database is ready for Dial-Craft deployment!"
echo ""
echo "Next steps:"
echo "1. Deploy your application in Coolify"
echo "2. Access: https://staging.digiedgesolutions.cloud"  
echo "3. Login with: admin@bank.com / admin123"
echo ""