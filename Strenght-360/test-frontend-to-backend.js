// Test script to simulate frontend call to backend /api/responses
const https = require('https');
const http = require('http');

const testData = {
  student_name: "Test Frontend User",
  student_email: "test.frontend@example.com",
  responses: {
    "1": "strongly_agree",
    "2": "agree", 
    "3": "neutral",
    "4": "disagree",
    "5": "strongly_disagree"
  },
  executing_score: 85,
  influencing_score: 72,
  relationship_building_score: 90,
  strategic_thinking_score: 78,
  primary_talent_domain: "Executing",
  test_start_time: "2024-01-01T10:00:00.000Z",
  test_completion_time: "2024-01-01T10:20:00.000Z",
  test_violations: [],
  is_auto_submit: false,
  questions_answered: 5
};

console.log('🧪 Testing frontend-to-backend API call...');
console.log('📍 Target: http://localhost:5100/api/responses');

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5100,
  path: '/api/responses',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  }
};

const req = http.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('✅ Response received:');
    console.log(body);
    
    if (res.statusCode === 200) {
      console.log('🎉 SUCCESS: API call completed successfully!');
      console.log('🌐 Check the server logs to see if the webhook was triggered.');
    } else {
      console.log('❌ FAILURE: API call failed');
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request Error:', err.message);
});

req.write(postData);
req.end();
