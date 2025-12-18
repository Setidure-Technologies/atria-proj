#!/bin/bash

# A3R Platform - API Verification Script
# Tests that the backend is returning correct test metadata

echo "================================================"
echo "A3R Platform - API Verification"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check database has correct test structure
echo "Test 1: Database Test Structure"
echo "--------------------------------"
docker exec -it atria_postgres psql -U atria_admin -d atria360 -c "
SELECT 
    title,
    type as engine_type,
    config_json->>'slug' as slug,
    config_json->>'runner' as runner,
    is_active
FROM tests 
WHERE is_active = true
ORDER BY created_at;
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database query successful${NC}"
else
    echo -e "${RED}❌ Database query failed${NC}"
fi
echo ""

# Test 2: Check if API is running
echo "Test 2: API Health Check"
echo "------------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:4902/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ API is healthy${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ API health check failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 3: Get candidate token (if candidate exists)
echo "Test 3: Get Candidate Assignments"
echo "----------------------------------"
echo "Attempting to login as candidate@test.com..."

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4902/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"candidate@test.com","password":"password123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
    echo ""
    
    # Test 4: Get assignments with new metadata
    echo "Test 4: Fetch Assignments with Metadata"
    echo "----------------------------------------"
    ASSIGNMENTS_RESPONSE=$(curl -s http://localhost:4902/api/candidate/assignments \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$ASSIGNMENTS_RESPONSE" | jq '.' 2>/dev/null || echo "$ASSIGNMENTS_RESPONSE"
    
    # Check if response includes new fields
    if echo "$ASSIGNMENTS_RESPONSE" | grep -q "testSlug"; then
        echo -e "${GREEN}✅ Response includes testSlug field${NC}"
    else
        echo -e "${YELLOW}⚠️  Response missing testSlug field${NC}"
    fi
    
    if echo "$ASSIGNMENTS_RESPONSE" | grep -q "engineType"; then
        echo -e "${GREEN}✅ Response includes engineType field${NC}"
    else
        echo -e "${YELLOW}⚠️  Response missing engineType field${NC}"
    fi
    
    if echo "$ASSIGNMENTS_RESPONSE" | grep -q "runner"; then
        echo -e "${GREEN}✅ Response includes runner field${NC}"
    else
        echo -e "${YELLOW}⚠️  Response missing runner field${NC}"
    fi
    
else
    echo -e "${YELLOW}⚠️  Login failed or candidate@test.com doesn't exist${NC}"
    echo "Response: $LOGIN_RESPONSE"
fi
echo ""

# Test 5: Check assignment statuses
echo "Test 5: Assignment Status Check"
echo "--------------------------------"
docker exec -it atria_postgres psql -U atria_admin -d atria360 -c "
SELECT 
    u.email,
    t.title,
    a.status,
    a.submitted_at IS NOT NULL as has_submission
FROM assignments a
JOIN users u ON a.user_id = u.id
JOIN tests t ON a.test_id = t.id
ORDER BY a.assigned_at DESC
LIMIT 5;
" 2>/dev/null
echo ""

# Summary
echo "================================================"
echo "Verification Complete"
echo "================================================"
echo ""
echo "Next Steps:"
echo "1. Login to candidate portal: http://localhost:4901"
echo "2. Check that test names display correctly"
echo "3. Start a Beyonders test and verify correct runner loads"
echo "4. Check browser console for routing logs:"
echo "   🔍 Test Dispatcher - Routing Decision"
echo "   ✅ Routing to BeyondersTestRunner: beyonders_science"
echo ""
