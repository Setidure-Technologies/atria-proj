const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const path = require('path');
const https = require('https'); // ← add this
const { spawn } = require('child_process');
const { processPsychometricData, generateComprehensivePDF } = require('./comprehensivePdfGenerator');

// Webhook URL
// n8n webhook URL
const N8N_WEBHOOK_URL = 'https://n8n.erudites.in/webhook/5eae77b7-4057-4df2-8d20-4dbc8f423f34';

const fsPromises = fs.promises;

const app = express();
const PORT = process.env.PORT || 5100;

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',  // Vite dev server
      'http://localhost:5174',  // Vite dev server
      'http://localhost:5175',  // Vite dev server (backup port)
      'http://localhost:5100',   // Backend server
      'https://test.peop360.com' // Production
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  })
);

// Add explicit OPTIONS handler for preflight requests
app.options('*', cors());

app.use(bodyParser.json());

// Serve static files from the dist directory (built frontend)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'responses.json');
const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_DIR = path.join(__dirname, 'reports');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ responses: [], nextId: 1 }, null, 2));
}

// Helper functions
const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return { responses: [], nextId: 1 };
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data file:', error);
    return false;
  }
};

// Send response data to n8n webhook
function sendToN8N(payload) {
  return new Promise((resolve, reject) => {
    try {
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
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              body,
            });
          });
        }
      );

      req.on('error', (err) => {
        reject(err);
      });

      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

const generateReportPdf = async ({ name, email, primaryDomain, scores }) => {
  const sanitizedName = name.replace(/\s+/g, '_');
  const pdfPath = path.join(REPORTS_DIR, `${sanitizedName}_report.pdf`);

  // Create PDF content
  const doc = new PDFDocument({ margin: 50 });
  const writeStream = fs.createWriteStream(pdfPath);

  doc.pipe(writeStream);
  doc.fontSize(20).text('Psychometric Test Report', { align: 'center' });
  doc.moveDown();

  doc.fontSize(14).text(`Candidate: ${name}`);
  doc.text(`Email: ${email}`);
  doc.text(`Primary Talent Domain: ${primaryDomain || 'N/A'}`);
  doc.moveDown();

  doc.fontSize(16).text('Scores Summary:');
  doc.moveDown(0.5);

  Object.entries(scores || {}).forEach(([domain, score]) => {
    doc.fontSize(14).text(`${domain}: ${score}`);
  });

  doc.end();

  // Wait for file to finish writing
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  return pdfPath;
};

const sendReportEmail = async ({ recipientEmail, recipientName, pdfPath }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_APP_PASSWORD || '',
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER || '',
    to: recipientEmail,
    subject: 'Your Psychometric Test Report',
    text: `Dear ${recipientName},\n\nPlease find attached your psychometric report.\n\nBest,\nStrength 360 Team`,
    attachments: [{
      filename: 'psychometric_report.pdf',
      path: pdfPath,
    }],
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Strength 360 API is running' });
});

// Simple health check for Docker
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Submit test response
app.post('/api/send-report', async (req, res) => {
  const { name, email, primaryDomain, scores } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, email',
    });
  }

  const hasEmailEnvVars = (process.env.EMAIL_USER || '').trim() && (process.env.EMAIL_APP_PASSWORD || '').trim();

  if (!hasEmailEnvVars) {
    return res.status(500).json({
      success: false,
      error: 'Email service not configured. Please set EMAIL_USER and EMAIL_APP_PASSWORD.',
    });
  }

  let pdfPath;

  try {
    pdfPath = await generateReportPdf({
      name,
      email,
      primaryDomain,
      scores: scores || {},
    });

    await sendReportEmail({
      recipientEmail: email,
      recipientName: name,
      pdfPath,
    });

    res.json({
      success: true,
      message: 'Report sent successfully',
    });
  } catch (error) {
    console.error('Error sending report email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send report',
    });
  } finally {
    if (pdfPath) {
      fsPromises
        .unlink(pdfPath)
        .catch((cleanupError) => console.error('Error cleaning up report file:', cleanupError));
    }
  }
});

// Submit test response
app.post('/api/responses', (req, res) => {
  console.log('🔥 /api/responses endpoint hit!'); // Debug log
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2)); // Debug log
  
  try {
    const {
      student_name,
      student_email,
      responses,
      executing_score,
      influencing_score,
      relationship_building_score,
      strategic_thinking_score,
      primary_talent_domain,
      detailed_scores, // Add detailed subdomain scores
    } = req.body;

    console.log('👤 Student:', student_name, student_email); // Debug log

    // Validate required fields
    if (!student_name || !student_email || !responses) {
      console.log('❌ Validation failed - missing required fields'); // Debug log
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: student_name, student_email, responses',
      });
    }

    const data = readData();

    // Create new response object
    const newResponse = {
      id: data.nextId,
      student_name,
      student_email,
      responses,
      executing_score,
      influencing_score,
      relationship_building_score,
      strategic_thinking_score,
      primary_talent_domain,
      detailed_scores, // Include detailed subdomain scores
      created_at: new Date().toISOString(),
    };

    // Add to responses array
    data.responses.push(newResponse);
    data.nextId += 1;

    // Save to file
    if (writeData(data)) {
      console.log(`New response saved: ${student_name} (${student_email})`);

      // Fire-and-forget call to n8n (do NOT block user response)
      console.log('🌐 About to call sendToN8N...'); // Debug log
      sendToN8N({
        type: 'psychometric_test_result',
        source: 'strength360-server',
        data: newResponse,
      })
        .then((result) => {
          console.log(
            `✅ Sent to n8n webhook. Status: ${result.statusCode}, Body: ${result.body}`
          );
        })
        .catch((err) => {
          console.error('⚠️  Failed to send data to n8n webhook:', err.message || err);
        });

      // Respond to frontend immediately
      res.json({
        success: true,
        id: newResponse.id,
        message: 'Response saved successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save response',
      });
    }
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get all responses (for admin)
app.get('/api/responses', (req, res) => {
  try {
    const data = readData();
    
    // Sort by created_at descending (newest first)
    const sortedResponses = data.responses.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json({
      success: true,
      responses: sortedResponses,
      total: sortedResponses.length
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch responses'
    });
  }
});

// Get responses by email
app.get('/api/responses/email/:email', (req, res) => {
  try {
    const { email } = req.params;
    const data = readData();
    
    const userResponses = data.responses
      .filter(response => response.student_email === email)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      success: true,
      responses: userResponses,
      total: userResponses.length
    });
  } catch (error) {
    console.error('Error fetching responses by email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch responses'
    });
  }
});

// Clear all responses (admin only)
app.delete('/api/responses', (req, res) => {
  try {
    const data = { responses: [], nextId: 1 };
    
    if (writeData(data)) {
      console.log('All responses cleared');
      res.json({
        success: true,
        message: 'All responses cleared successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to clear responses'
      });
    }
  } catch (error) {
    console.error('Error clearing responses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const data = readData();
    const responses = data.responses;
    
    const stats = {
      totalResponses: responses.length,
      uniqueStudents: new Set(responses.map(r => r.student_email)).size,
      domainBreakdown: {},
      recentActivity: responses
        .slice(0, 10)
        .map(r => ({
          student_name: r.student_name,
          primary_domain: r.primary_talent_domain,
          created_at: r.created_at
        }))
    };

    // Calculate domain breakdown
    responses.forEach(response => {
      const domain = response.primary_talent_domain;
      stats.domainBreakdown[domain] = (stats.domainBreakdown[domain] || 0) + 1;
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error generating stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate statistics'
    });
  }
});

// Generate PDF report endpoint using comprehensive Node.js generator
app.post('/api/generate-pdf', async (req, res) => {
  console.log('🔥 /api/generate-pdf endpoint hit!');
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { testResponseId } = req.body;
    
    if (!testResponseId) {
      console.log('❌ Missing testResponseId');
      return res.status(400).json({
        success: false,
        error: 'Missing testResponseId'
      });
    }
    
    console.log('🔍 Looking for test response ID:', testResponseId);
    
    // Read the saved test response data
    const data = readData();
    console.log('📊 Total responses in database:', data.responses.length);
    
    const testResponse = data.responses.find(r => r.id === parseInt(testResponseId));
    
    if (!testResponse) {
      console.log('❌ Test response not found for ID:', testResponseId);
      console.log('📋 Available IDs:', data.responses.map(r => r.id));
      return res.status(404).json({
        success: false,
        error: 'Test response not found'
      });
    }
    
    console.log('✅ Found test response:', testResponse.student_name);
    console.log('📋 Processing data with comprehensive analyzer...');
    
    // Process the psychometric data using the converted Python logic
    const processedData = processPsychometricData(testResponse);
    console.log('✅ Data processing complete');
    
    console.log('📋 Generating comprehensive PDF...');
    
    // Generate PDF using comprehensive Node.js generator
    const result = await generateComprehensivePDF(processedData);
    
    console.log('✅ PDF generation successful');
    
    if (!result.success) {
      console.log('❌ PDF generation failed');
      return res.status(500).json({
        success: false,
        error: 'PDF generation failed'
      });
    }
    
    // Send PDF directly from buffer
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `comprehensive-strength-report-${testResponse.student_name.replace(/\s+/g, '_')}-${timestamp}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(result.buffer);
    
    console.log('✅ PDF sent successfully to client');
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF report'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Serve frontend for any non-API routes (SPA fallback)
app.get('*', (req, res) => {
  // Don't serve frontend for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found'
    });
  }
  
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built. Run "npm run build" first.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Psychometric Test Server running on port ${PORT}`);
  console.log(`📊 Application: http://localhost:${PORT}/`);
  console.log(`👤 Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
  console.log(`💾 Data file: ${DATA_FILE}`);
  
  // Check if frontend is built
  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    console.log(`⚠️  Frontend not built. Run "npm run build" to serve frontend files.`);
  }
});

module.exports = app;
