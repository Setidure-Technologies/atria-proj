const https = require('https');

const N8N_WEBHOOK_URL = 'https://n8n.erudites.in/webhook/5eae77b7-4057-4df2-8d20-4dbc8f423f34';

function sendTest() {
  console.log('🚀 Testing webhook:', N8N_WEBHOOK_URL);
  
  const payload = {
    type: 'psychometric_test_result',
    source: 'manual-test',
    data: {
      id: 999,
      student_name: 'Webhook Test User',
      student_email: 'webhook-test@example.com',
      responses: {
        Q1: { statementA: 'A', statementB: 'B' },
        Q2: { statementA: 'B', statementB: 'A' },
      },
      executing_score: 10,
      influencing_score: 18,
      relationship_building_score: 14,
      strategic_thinking_score: 16,
      primary_talent_domain: 'INFLUENCING',
      created_at: new Date().toISOString(),
    },
  };

  console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));
  const postData = JSON.stringify(payload);

  const req = https.request(
    N8N_WEBHOOK_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    },
    (res) => {
      console.log('📨 Response Status:', res.statusCode);
      console.log('📨 Response Headers:', res.headers);
      
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        console.log('✅ Response Body:', body || '(empty)');
        console.log('🎯 Webhook test completed!');
      });
    }
  );

  req.on('error', (err) => {
    console.error('❌ Request Error:', err.message || err);
  });

  req.write(postData);
  req.end();
}

console.log('🔧 Starting webhook test...');
sendTest();
