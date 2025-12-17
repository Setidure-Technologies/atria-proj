import axios from 'axios';

async function testWebhookIntegration() {
    try {
        console.log('🔗 Testing webhook integration...');
        
        // Test data that simulates webhook payload
        const webhookPayload = {
            id: 21,
            student_name: "Webhook Test User",
            student_email: "webhook@test.com",
            created_at: "2024-11-25T10:30:00Z",
            detailed_scores: {
                executing: 85.2,
                influencing: 88.1,
                relationshipBuilding: 92.5,
                strategicThinking: 94.8,
                subdomains: {
                    "Ideation": 96.5,
                    "Strategic": 93.2,
                    "Analytical": 92.8,
                    "Intellection": 91.4,
                    "Harmony": 94.1,
                    "Relator": 90.7,
                    "Communication": 87.3,
                    "Achiever": 84.9,
                    "Developer": 89.6,
                    "Empathy": 95.3
                }
            },
            primary_talent_domain: "Strategic Thinking",
            responses: []
        };
        
        // Save test data
        const saveResponse = await axios.post('http://localhost:5100/api/responses', webhookPayload);
        console.log('💾 Webhook test data saved with ID:', saveResponse.data.id);
        
        // Test webhook sending
        const webhookResponse = await axios.post('http://localhost:5100/api/send-report', {
            testResponseId: saveResponse.data.id
        });
        
        console.log('🚀 Webhook response:', webhookResponse.data);
        console.log('✅ Webhook integration test completed successfully!');
        
    } catch (error) {
        console.error('❌ Webhook test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testWebhookIntegration();
