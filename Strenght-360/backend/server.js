/**
 * ATRIA 360 Backend API Server
 * Integrated with PostgreSQL database
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const candidateRoutes = require('./routes/candidate');

// Import database service
const { pool, getDashboardStats } = require('./services/database');

const app = express();
const PORT = process.env.PORT || 4902;

// ============================================
// MIDDLEWARE
// ============================================

app.use(
    cors({
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:4901', // Candidate app
            'http://localhost:4903', // Admin portal
            process.env.CORS_ORIGINS,
        ].filter(Boolean),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        credentials: true,
    })
);

// Explicit OPTIONS handler for preflight
app.options('*', cors());

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log request bodies
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        const bodySize = JSON.stringify(req.body).length;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        console.log(`  Body size: ${bodySize} bytes`);
        if (bodySize > 0 && bodySize < 500) {
            console.log(`  Body preview:`, req.body);
        } else if (bodySize === 2) {
            console.warn(`  ⚠️ WARNING: Empty body detected ({})`);
        }
    }
    next();
});

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Serve static files from dist directory (built frontend)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    console.log(`📁 Serving static files from: ${distPath}`);
}

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        await pool.query('SELECT 1');

        res.json({
            status: 'OK',
            message: 'ATRIA 360 API is running',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: error.message,
        });
    }
});

// ============================================
// API ROUTES
// ============================================

// Authentication routes
app.use('/api/auth', authRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Candidate routes
app.use('/api/candidate', candidateRoutes);

// ============================================
// BACKWARD COMPATIBILITY ROUTES
// (For existing frontend until it's updated)
// ============================================

const {
    createResponse,
    listResponses: dbListResponses,
    getResponseById,
} = require('./services/database');

/**
 * POST /api/responses
 * Submit test response (backward compatibility)
 */
app.post('/api/responses', async (req, res) => {
    console.log('🔥 /api/responses endpoint hit (backward compatibility)');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

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
            detailed_scores,
            test_start_time,
            test_completion_time,
            test_violations,
            is_auto_submit,
            questions_answered,
        } = req.body;

        console.log('👤 Student:', student_name, student_email);

        // Validate required fields
        if (!student_name || !student_email || !responses) {
            console.log('❌ Validation failed - missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: student_name, student_email, responses',
            });
        }

        // For now, create a dummy assignment for backward compatibility
        // TODO: Remove this once frontend is updated to use proper flow
        const { createUser, createTest, createAssignment } = require('./services/database');

        // Check if user exists, create if not
        let user = await require('./services/database').getUserByEmail(student_email);
        if (!user) {
            user = await createUser({
                email: student_email,
                name: student_name,
                role: 'CANDIDATE',
                status: 'active',
            });
        }

        // Check if default test exists, create if not
        let test = await require('./services/database').getTestById('00000000-0000-0000-0000-000000000001');
        if (!test) {
            const tests = await require('./services/database').listTests();
            test = tests[0]; // Use first available test

            if (!test) {
                // Create default psychometric test
                test = await createTest({
                    title: 'Strength 360 - Psychometric Assessment',
                    description: 'Default psychometric test',
                    type: 'psychometric',
                    durationMinutes: 20,
                });
            }
        }

        // Create assignment
        const assignment = await createAssignment({
            testId: test.id,
            userId: user.id,
            assignedBy: user.id, // Self-assigned for backward compatibility
        });

        // Update assignment to started
        await require('./services/database').updateAssignmentStatus(assignment.id, 'started');

        // Create response
        const response = await createResponse({
            assignmentId: assignment.id,
            responsesJson: responses,
            executingScore: executing_score,
            influencingScore: influencing_score,
            relationshipBuildingScore: relationship_building_score,
            strategicThinkingScore: strategic_thinking_score,
            primaryTalentDomain: primary_talent_domain,
            detailedScores: detailed_scores,
            testStartTime: test_start_time,
            testCompletionTime: test_completion_time || new Date(),
            testViolations: test_violations,
            isAutoSubmit: is_auto_submit || false,
            questionsAnswered: questions_answered || Object.keys(responses).length,
        });

        // Update assignment to submitted
        await require('./services/database').updateAssignmentStatus(assignment.id, 'submitted');

        console.log(`✅ Response saved: ${student_name} (${student_email})`);

        res.json({
            success: true,
            id: response.id,
            message: 'Response saved successfully',
        });
    } catch (error) {
        console.error('❌ Error saving response:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});

/**
 * GET /api/responses
 * Get all responses (for admin)
 */
app.get('/api/responses', async (req, res) => {
    try {
        const responses = await dbListResponses();

        res.json({
            success: true,
            responses: responses.map(r => ({
                id: r.id,
                student_name: r.user_name,
                student_email: r.user_email,
                executing_score: r.executing_score,
                influencing_score: r.influencing_score,
                relationship_building_score: r.relationship_building_score,
                strategic_thinking_score: r.strategic_thinking_score,
                primary_talent_domain: r.primary_talent_domain,
                detailed_scores: r.detailed_scores,
                responses: r.responses_json,
                created_at: r.submitted_at,
            })),
            total: responses.length,
        });
    } catch (error) {
        console.error('Error fetching responses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch responses',
        });
    }
});

/**
 * DELETE /api/responses
 * Clear all responses (admin only)
 */
app.delete('/api/responses', async (req, res) => {
    try {
        await pool.query('DELETE FROM responses');
        console.log('All responses cleared');

        res.json({
            success: true,
            message: 'All responses cleared successfully',
        });
    } catch (error) {
        console.error('Error clearing responses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear responses',
        });
    }
});

/**
 * GET /api/stats
 * Get statistics
 */
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await getDashboardStats();

        res.json({
            success: true,
            stats: {
                totalResponses: stats.completedTests || 0,
                uniqueStudents: stats.totalUsers || 0,
                domainBreakdown: stats.domainBreakdown || {},
                recentActivity: [], // TODO: Implement recent activity
            },
        });
    } catch (error) {
        console.error('Error generating stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate statistics',
        });
    }
});

/**
 * POST /api/generate-pdf
 * Generate PDF report
 */
app.post('/api/generate-pdf', async (req, res) => {
    console.log('🔥 /api/generate-pdf endpoint hit!');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

    try {
        const { testResponseId } = req.body;

        if (!testResponseId) {
            return res.status(400).json({
                success: false,
                error: 'Missing testResponseId',
            });
        }

        const response = await getResponseById(testResponseId);

        if (!response) {
            return res.status(404).json({
                success: false,
                error: 'Test response not found',
            });
        }

        // Use the existing PDF generator if available
        const { processPsychometricData, generateComprehensivePDF } = require('./comprehensivePdfGenerator');
        const { generateBeyondersPDF } = require('./beyondersPdfGenerator');

        let result;

        if (response.test_type && response.test_type.startsWith('beyonders')) {
            // Handle Beyonders PDF
            const beyondersData = {
                student_name: response.user_name,
                student_email: response.user_email,
                test_title: response.test_title,
                score_json: response.score_json || {},
                responses: response.responses_json
            };
            result = await generateBeyondersPDF(beyondersData);
        } else {
            // Handle Psychometric PDF (Default)
            // Convert response to expected format
            const testResponse = {
                id: response.id,
                student_name: response.user_name,
                student_email: response.user_email,
                responses: response.responses_json,
                executing_score: response.executing_score,
                influencing_score: response.influencing_score,
                relationship_building_score: response.relationship_building_score,
                strategic_thinking_score: response.strategic_thinking_score,
                primary_talent_domain: response.primary_talent_domain,
                detailed_scores: response.detailed_scores,
            };

            const processedData = processPsychometricData(testResponse);
            result = await generateComprehensivePDF(processedData);
        }

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: 'PDF generation failed',
            });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `strength-report-${response.user_name.replace(/\s+/g, '_')}-${timestamp}.pdf`;
        const filePath = path.join(__dirname, 'reports', `response-${testResponseId}.pdf`);

        // Save PDF to filesystem
        try {
            fs.writeFileSync(filePath, result.buffer);
            console.log(`✅ PDF saved to: ${filePath}`);
        } catch (saveError) {
            console.warn(`⚠️ Failed to save PDF to filesystem:`, saveError);
            // Continue even if save fails - user still gets download
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(result.buffer);

        console.log('✅ PDF sent successfully');
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate PDF report',
        });
    }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// SPA fallback for non-API routes
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend not built. Run "npm run build" first.');
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ================================================');
    console.log('🚀  ATRIA 360 Backend API Server');
    console.log('🚀 ================================================');
    console.log(`📡 Server:        http://localhost:${PORT}`);
    console.log(`🔧 API Health:    http://localhost:${PORT}/api/health`);
    console.log(`📊 Application:   http://localhost:${PORT}/`);
    console.log(`👨‍💼 Admin Routes:  http://localhost:${PORT}/api/admin/*`);
    console.log(`🎓 Candidate:     http://localhost:${PORT}/api/candidate/*`);
    console.log(`🔐 Auth:          http://localhost:${PORT}/api/auth/*`);
    console.log('🚀 ================================================');
    console.log('');

    // Check database connection
    pool.query('SELECT 1')
        .then(() => console.log('✅ Database connected'))
        .catch(err => console.error('❌ Database connection failed:', err.message));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await pool.end();
    process.exit(0);
});

module.exports = app;
