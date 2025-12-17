#!/bin/bash
set -e

echo "🎯 Creating Test Data"
echo "===================="
echo ""

# Get admin token
echo "1️⃣  Logging in as admin..."
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4902/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@atria360.com","password":"Admin@123"}' \
  | jq -r '.token')

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Admin logged in"

# Create candidate user
echo "2️⃣  Creating candidate user..."
CANDIDATE_RESULT=$(curl -s -X POST http://localhost:4902/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "email":"candidate@test.com",
    "name":"Test Candidate",
    "phone":"1234567890",
    "password":"Test@123",
    "role":"CANDIDATE"
  }')

CANDIDATE_ID=$(echo $CANDIDATE_RESULT | jq -r '.user.id')
echo "✅ Candidate created: $CANDIDATE_ID"

# Get available tests
echo "3️⃣  Getting available tests..."
TESTS=$(curl -s -X GET http://localhost:4902/api/admin/tests \
  -H "Authorization: Bearer $ADMIN_TOKEN")

TEST_ID=$(echo $TESTS | jq -r '.tests[0].id')
echo "✅ Found test: $TEST_ID"

# Create assignment
echo "4️⃣  Assigning test to candidate..."
ASSIGNMENT=$(curl -s -X POST http://localhost:4902/api/admin/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"testId\":\"$TEST_ID\",
    \"userId\":\"$CANDIDATE_ID\"
  }")

ASSIGNMENT_ID=$(echo $ASSIGNMENT | jq -r '.assignment.id')
echo "✅ Assignment created: $ASSIGNMENT_ID"

echo ""
echo "✅ Test data created successfully!"
echo ""
echo "📝 Credentials:"
echo "   Email: candidate@test.com"
echo "   Password: Test@123"
echo ""
echo "🔗 Login at: http://localhost:4901/login"
echo ""
