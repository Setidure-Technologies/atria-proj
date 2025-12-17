import axios from 'axios';
import fs from 'fs';

// Test data for comprehensive PDF generation
const testData = {
    id: 1,
    student_name: "Test User",
    student_email: "test@example.com",
    created_at: "2024-11-25T10:00:00Z",
    detailed_scores: {
        executing: 78.5,
        influencing: 82.3,
        relationshipBuilding: 91.2,
        strategicThinking: 89.7,
        subdomains: {
            "Ideation": 95.2,
            "Analytical": 88.4,
            "Harmony": 91.8,
            "Intellection": 87.6,
            "Strategic": 92.1,
            "Relator": 89.3,
            "Communication": 84.7,
            "Achiever": 81.5,
            "Developer": 86.9,
            "Empathy": 93.4
        }
    },
    primary_talent_domain: "Strategic Thinking",
    responses: []
};

async function testComprehensivePDF() {
    try {
        console.log('🧪 Testing comprehensive PDF generation...');
        
        // First, save test data to the responses file
        const saveResponse = await axios.post('http://localhost:5100/api/responses', testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('💾 Test data saved with ID:', saveResponse.data.id);
        
        // Now generate PDF using the saved test response
        const response = await axios.post('http://localhost:5100/api/generate-pdf', {
            testResponseId: saveResponse.data.id
        }, {
            responseType: 'arraybuffer',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
            console.log('✅ PDF generated successfully!');
            console.log(`📄 Response size: ${response.data.byteLength} bytes`);
            console.log(`📋 Content type: ${response.headers['content-type']}`);
            
            // Save the PDF to test file
            fs.writeFileSync('test-comprehensive-report.pdf', response.data);
            console.log('💾 PDF saved as test-comprehensive-report.pdf');
            console.log('🎉 Test completed successfully!');
        } else {
            console.log('❌ Unexpected response status:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data.toString());
        }
    }
}

testComprehensivePDF();
