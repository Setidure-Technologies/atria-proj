#!/bin/bash

# Database Migration Script for Beyonders 360 Integration
# This script applies the necessary database changes and sets up tests

echo "🔄 Starting Beyonders 360 Migration..."

# Database connection details
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"4904"}
DB_NAME=${DB_NAME:-"atria360"}
DB_USER=${DB_USER:-"atria_admin"}
DB_PASSWORD=${DB_PASSWORD:-"atria_secure_2024"}

# Check if PostgreSQL is running
echo "📡 Checking database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\q" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed. Please ensure PostgreSQL is running on $DB_HOST:$DB_PORT"
    exit 1
fi

echo "✅ Database connection successful"

# Apply the Beyonders 360 setup migration
echo "📝 Applying Beyonders 360 setup migration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "./init-scripts/02_beyonders_test_setup.sql"

if [ $? -eq 0 ]; then
    echo "✅ Beyonders 360 migration applied successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

# Verify the tests are created
echo "🔍 Verifying test configuration..."
TEST_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM tests WHERE is_active = TRUE;")

if [ "$TEST_COUNT" -ge 2 ]; then
    echo "✅ Found $TEST_COUNT active tests in the system"
    
    # List the tests
    echo "📋 Available tests:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT title, type, is_active FROM tests ORDER BY created_at;"
else
    echo "⚠️ Warning: Expected at least 2 active tests, found $TEST_COUNT"
fi

# Check if bulk operations table exists
echo "🔍 Checking bulk operations support..."
BULK_TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bulk_operations');")

if [ "$BULK_TABLE_EXISTS" = " t" ]; then
    echo "✅ Bulk operations support is available"
else
    echo "❌ Bulk operations table not found"
    exit 1
fi

# Test the Beyonders 360 configuration
echo "🎯 Testing Beyonders 360 configuration..."
BEYONDERS_CONFIG=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT config_json FROM tests WHERE type = 'adaptive' AND config_json->>'testType' = 'beyonders_360';")

if [ ! -z "$BEYONDERS_CONFIG" ]; then
    echo "✅ Beyonders 360 test configuration found"
else
    echo "❌ Beyonders 360 configuration not found"
    exit 1
fi

echo "🎉 Migration completed successfully!"
echo ""
echo "📋 Summary:"
echo "   • Beyonders 360 adaptive test configured"
echo "   • Bulk operations support enabled"
echo "   • Database schema updated"
echo "   • System ready for test assignments"
echo ""
echo "🚀 You can now:"
echo "   1. Access the admin portal at http://localhost:4903"
echo "   2. Create users and assign tests"
echo "   3. Use bulk operations for CSV imports"
echo "   4. Take tests via assignment links"

exit 0
