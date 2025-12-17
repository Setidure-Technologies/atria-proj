#!/bin/bash

# Login as admin
TOKEN=$(curl -s -X POST http://localhost:4902/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@atria360.com","password":"Admin@123"}' | jq -r .token)

echo "Admin Token: $TOKEN"

# Create Science Test
echo "Creating Science Test..."
curl -s -X POST http://localhost:4902/api/admin/tests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Beyonders Science Assessment",
    "description": "Assessment for Science stream students",
    "type": "beyonders_science",
    "durationMinutes": 60,
    "isActive": true
  }' | jq .

# Create Non-Science Test
echo "Creating Non-Science Test..."
curl -s -X POST http://localhost:4902/api/admin/tests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Beyonders Non-Science Assessment",
    "description": "Assessment for Non-Science stream students",
    "type": "beyonders_non_science",
    "durationMinutes": 60,
    "isActive": true
  }' | jq .
