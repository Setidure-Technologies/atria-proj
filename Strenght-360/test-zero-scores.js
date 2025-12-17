import axios from 'axios';

async function testPDFWithZeroScores() {
    try {
        console.log('🧪 Testing PDF generation with zero scores...');
        
        // Test data with all zero scores (like incomplete test)
        const zeroScoreData = {
            student_name: "Zero Score Test",
            student_email: "zerotest@example.com",
            created_at: "2024-11-25T11:00:00Z",
            detailed_scores: {
                executing: 0,
                influencing: 0,
                relationshipBuilding: 0,
                strategicThinking: 0,
                subdomains: {
                    "Ideation": 0,
                    "Analytical": 0,
                    "Harmony": 0,
                    "Intellection": 0,
                    "Strategic": 0,
                    "Relator": 0,
                    "Communication": 0,
                    "Achiever": 0,
                    "Developer": 0,
                    "Empathy": 0
                }
            },
            primary_talent_domain: "Executing",
            responses: []
        };
        
        // Save test data
        const saveResponse = await axios.post('http://localhost:5100/api/responses', zeroScoreData);
        console.log('💾 Zero score test data saved with ID:', saveResponse.data.id);
        
        // Generate PDF
        const response = await axios.post('http://localhost:5100/api/generate-pdf', {
            testResponseId: saveResponse.data.id
        }, {
            responseType: 'arraybuffer',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
            console.log('✅ PDF generated successfully for zero scores!');
            console.log(`📄 Response size: ${response.data.byteLength} bytes`);
            
            // Save the PDF to test file
            const fs = await import('fs');
            fs.writeFileSync('test-zero-scores-report.pdf', response.data);
            console.log('💾 PDF saved as test-zero-scores-report.pdf');
            console.log('🎉 Zero scores test completed successfully!');
        }
        
    } catch (error) {
        console.error('❌ Zero scores test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data.toString());
        }
    }
}

testPDFWithZeroScores();
