#!/bin/bash

# ATRIA 360 Backend API Test Script
# Tests all major endpoints to verify Phase 2 integration

set -e

echo "🧪 ATRIA 360 Backend API Test Suite"
echo "===================================="
echo ""

API_URL="http://localhost:4902"
TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local auth_header=$5
    
    echo -n "Testing: $name... "
    
    if [ -n "$auth_header" ]; then
        response=$(curl -s -X $method "${API_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${auth_header}" \
            ${data:+-d "$data"})
    else
        response=$(curl -s -X $method "${API_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            ${data:+-d "$data"})
    fi
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Response: $response"
        ((FAILED++))
        return 1
    fi
}

echo "1️⃣  Health Checks"
echo "─────────────────"

# Test health endpoint
if curl -s "${API_URL}/health" | grep -q "OK"; then
    echo -e "${GREEN}✓${NC} Basic health check"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Basic health check"
    ((FAILED++))
fi

# Test API health
if curl -s "${API_URL}/api/health" | grep -q '"status":"OK"'; then
    echo -e "${GREEN}✓${NC} API health check (with DB)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} API health check (with DB)"
    ((FAILED++))
fi

echo ""
echo "2️⃣  Authentication"
echo "─────────────────"

# Test admin login
echo -n "Admin login... "
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@atria360.com","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    echo -e "${GREEN}✓ PASSED${NC}"
    echo "   Token: ${TOKEN:0:20}..."
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "   Response: $LOGIN_RESPONSE"
    ((FAILED++))
    echo ""
    echo -e "${RED}Cannot proceed without token. Exiting.${NC}"
    exit 1
fi

# Test get current user
test_endpoint "Get current user" "GET" "/api/auth/me" "" "$TOKEN"

echo ""
echo "3️⃣  Admin - Dashboard"
echo "─────────────────────"

test_endpoint "Dashboard stats" "GET" "/api/admin/dashboard" "" "$TOKEN"

echo ""
echo "4️⃣  Admin - User Management"
echo "───────────────────────────"

test_endpoint "List users" "GET" "/api/admin/users" "" "$TOKEN"

# Create test user
RANDOM_EMAIL="test$(date +%s)@example.com"
CREATE_USER_DATA="{\"email\":\"$RANDOM_EMAIL\",\"name\":\"Test User\",\"phone\":\"1234567890\",\"sendInvite\":false}"
test_endpoint "Create user" "POST" "/api/admin/users" "$CREATE_USER_DATA" "$TOKEN"

echo ""
echo "5️⃣  Admin - Test Management"
echo "───────────────────────────"

test_endpoint "List tests" "GET" "/api/admin/tests" "" "$TOKEN"

# Create test
CREATE_TEST_DATA="{\"title\":\"Test Suite Test\",\"description\":\"Created by test script\",\"type\":\"psychometric\",\"durationMinutes\":20}"
test_endpoint "Create test" "POST" "/api/admin/tests" "$CREATE_TEST_DATA" "$TOKEN"

echo ""
echo "6️⃣  Admin - Assignment Management"
echo "──────────────────────────────────"

test_endpoint "List assignments" "GET" "/api/admin/assignments" "" "$TOKEN"

echo ""
echo "7️⃣  Admin - Response Viewing"
echo "────────────────────────────"

test_endpoint "List responses" "GET" "/api/admin/responses" "" "$TOKEN"

echo ""
echo "8️⃣  Backward Compatibility"
echo "─────────────────────────"

test_endpoint "Legacy /api/stats" "GET" "/api/stats" ""
test_endpoint "Legacy /api/responses (GET)" "GET" "/api/responses" ""

echo ""
echo "════════════════════════════════════"
echo "📊 Test Results"
echo "════════════════════════════════════"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🎉 Backend API is fully functional and ready!"
    echo ""
    echo "Next steps:"
    echo "1. Check http://localhost:4908 for invitation emails"
    echo "2. View database: docker exec -it atria_postgres psql -U atria_admin -d atria360"
    echo "3. Move to Phase 3: Frontend integration"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
    exit 1
fi
