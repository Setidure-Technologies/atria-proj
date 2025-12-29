/**
 * Candidate Routes
 * Handles test access, submission, and user-specific operations
 */

const express = require('express');
const router = express.Router();
const {
    getUserAssignments,
    getAssignmentByToken,
    getAssignmentById,
    updateAssignmentStatus,
    createResponse,
    getResponseByAssignmentId,
    listResponses,
    updateUser,
    queueEmail,
    pool,
} = require('../services/database');
const { requireAuth, requireCandidate, optionalAuth } = require('../middleware/auth');

// ============================================
// TEST ACCESS
// ============================================

/**
 * GET /api/candidate/assignments
 * Get all assignments for the logged-in candidate
 */
router.get('/assignments', requireAuth, requireCandidate, async (req, res) => {
    try {
        const assignments = await getUserAssignments(req.user.id);

        // Transform assignments to include testSlug and runner from config_json
        const transformedAssignments = assignments.map(assignment => ({
            ...assignment,
            engineType: assignment.type, // Engine type (psychometric/adaptive/custom)
            testSlug: assignment.config_json?.slug || null, // Product identity
            runner: assignment.config_json?.runner || null, // Runner component name
            config: assignment.config_json || {}, // Full config for reference
        }));

        res.json({
            success: true,
            assignments: transformedAssignments,
        });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get assignments',
        });
    }
});

/**
 * GET /api/candidate/test/:assignmentId
 * Verify test access token and get test details
 */
router.get('/test/:assignmentId', optionalAuth, async (req, res) => {
    try {
        const { token } = req.query;
        const { assignmentId } = req.params;

        let assignment;

        if (token) {
            // Get assignment by token
            assignment = await getAssignmentByToken(token);
        }

        if (!assignment && req.user) {
            // Get assignment by ID and verify ownership
            assignment = await getAssignmentById(assignmentId);
            if (assignment && assignment.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to this test',
                });
            }
        }

        if (!assignment) {
            return res.status(400).json({
                success: false,
                error: 'Access token or login required',
            });
        }

        if (!assignment || assignment.id !== assignmentId) {
            return res.status(404).json({
                success: false,
                error: 'Invalid or expired test link',
            });
        }

        // Check if already submitted
        if (assignment.status === 'submitted') {
            return res.status(400).json({
                success: false,
                error: 'This test has already been submitted',
                submitted: true,
            });
        }

        // Check if expired
        if (assignment.due_at && new Date(assignment.due_at) < new Date()) {
            await updateAssignmentStatus(assignment.id, 'expired');
            return res.status(400).json({
                success: false,
                error: 'This test has expired',
                expired: true,
            });
        }

        // Update status to 'started' if not already
        if (assignment.status === 'assigned') {
            await updateAssignmentStatus(assignment.id, 'started');
        }

        res.json({
            success: true,
            assignment: {
                id: assignment.id,
                testId: assignment.test_id,
                testTitle: assignment.test_title,
                testDescription: assignment.description,
                testType: assignment.type, // Keep for backward compatibility
                engineType: assignment.type, // Engine type (psychometric/adaptive/custom)
                testSlug: assignment.config_json?.slug || null, // Product identity
                runner: assignment.config_json?.runner || null, // Runner component name
                config: assignment.config_json || {},
                durationMinutes: assignment.duration_minutes,
                status: assignment.status === 'assigned' ? 'started' : assignment.status,
                dueAt: assignment.due_at,
                startedAt: assignment.started_at || new Date(),
            },
            user: {
                name: assignment.user_name,
                email: assignment.user_email,
            }
        });
    } catch (error) {
        console.error('Get test error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get test',
        });
    }
});

/**
 * POST /api/candidate/test/:assignmentId/submit
 * Submit test responses
 */
router.post('/test/:assignmentId/submit', optionalAuth, async (req, res) => {
    try {
        console.log('📥 Submit Request Body:', JSON.stringify(req.body, null, 2));

        if (!req.body || Object.keys(req.body).length === 0) {
            console.error('❌ Empty request body received');
            return res.status(400).json({
                success: false,
                error: 'Empty request body',
            });
        }

        const { token, responses, scores, studentData } = req.body;
        const { assignmentId } = req.params;

        // Extract scores from either 'scores' object or flat fields
        const executingScore = scores?.executing || req.body.executing_score;
        const influencingScore = scores?.influencing || req.body.influencing_score;
        const relationshipBuildingScore = scores?.relationshipBuilding || req.body.relationship_building_score;
        const strategicThinkingScore = scores?.strategicThinking || req.body.strategic_thinking_score;
        const primaryTalentDomain = scores?.primaryDomain || req.body.primary_talent_domain;
        const detailedScores = scores?.detailed || req.body.detailed_scores;
        const testStartTime = scores?.testStartTime || req.body.test_start_time;
        const testCompletionTime = scores?.testCompletionTime || req.body.test_completion_time;
        const testViolations = scores?.violations || req.body.test_violations;
        const isAutoSubmit = scores?.isAutoSubmit || req.body.is_auto_submit;

        // Extract responses
        const responsesJson = responses || req.body.responsesJson || {};

        let assignment;

        if (token) {
            assignment = await getAssignmentByToken(token);
        }

        if (!assignment && req.user) {
            assignment = await getAssignmentById(assignmentId);
            if (assignment && assignment.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Unauthorized access to this test',
                });
            }
        }

        if (!assignment) {
            return res.status(400).json({
                success: false,
                error: 'Access token or login required',
            });
        }

        if (!assignment || assignment.id !== assignmentId) {
            return res.status(404).json({
                success: false,
                error: 'Invalid or expired test link',
            });
        }

        // Check if already submitted
        if (assignment.status === 'submitted') {
            return res.status(400).json({
                success: false,
                error: 'This test has already been submitted',
            });
        }

        // Update user with student data if provided
        if (studentData) {
            await updateUser(assignment.user_id, {
                date_of_birth: studentData.dateOfBirth,
                institution: studentData.institution,
                board_of_study: studentData.boardOfStudy,
                parent_name: studentData.parentName,
                parent_occupation: studentData.parentOccupation,
                annual_income: studentData.annualIncome,
                full_address: studentData.fullAddress,
                location_latitude: studentData.location?.latitude,
                location_longitude: studentData.location?.longitude,
                location_address: studentData.location?.address,
            });
        }

        // Use transaction to ensure atomicity
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Create response within transaction
            const responseResult = await client.query(
                `INSERT INTO responses (
                    assignment_id, responses_json, score_json,
                    executing_score, influencing_score, relationship_building_score, strategic_thinking_score,
                    primary_talent_domain, detailed_scores,
                    test_start_time, test_completion_time, test_violations,
                    is_auto_submit, questions_answered
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *`,
                [
                    assignment.id,
                    JSON.stringify(responsesJson),
                    JSON.stringify(scores || req.body.scoreJson || {
                        executing: executingScore,
                        influencing: influencingScore,
                        relationshipBuilding: relationshipBuildingScore,
                        strategicThinking: strategicThinkingScore,
                        primaryDomain: primaryTalentDomain,
                        detailed: detailedScores
                    }),
                    executingScore,
                    influencingScore,
                    relationshipBuildingScore,
                    strategicThinkingScore,
                    primaryTalentDomain,
                    JSON.stringify(detailedScores),
                    testStartTime,
                    testCompletionTime || new Date(),
                    JSON.stringify(testViolations || []),
                    isAutoSubmit || false,
                    Object.keys(responsesJson).length,
                ]
            );

            const response = responseResult.rows[0];

            // Update assignment status to submitted within same transaction
            await client.query(
                `UPDATE assignments 
                SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP
                WHERE id = $1`,
                [assignment.id]
            );

            await client.query('COMMIT');
            client.release();

            console.log(`✅ Test submitted successfully: Response ID ${response.id}`);

            // Queue completion email
            try {
                const userResult = await client.query('SELECT name, email FROM users WHERE id = $1', [assignment.user_id]);
                const user = userResult.rows[0];

                if (user) {
                    await queueEmail({
                        toEmail: user.email,
                        subject: 'Test Completed Successfully - Atria University',
                        templateName: 'test_completion',
                        templateData: { studentName: user.name },
                    });
                    console.log(`📧 Queued completion email for ${user.email}`);
                }
            } catch (emailError) {
                console.error('Failed to queue completion email:', emailError);
                // Don't fail the request if email fails
            }

            res.json({
                success: true,
                responseId: response.id,
                message: 'Test submitted successfully',
            });
        } catch (transactionError) {
            await client.query('ROLLBACK');
            client.release();

            console.error('Transaction failed, rolled back:', transactionError);
            throw transactionError;
        }
    } catch (error) {
        console.error('Submit test error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit test',
        });
    }
});

/**
 * POST /api/candidate/test/:assignmentId/submit-adaptive
 * Submit adaptive test (Beyonders)
 */
router.post('/test/:assignmentId/submit-adaptive', requireCandidate, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { responses, scores, testMetrics } = req.body;
        const { narrativeResponses, cardSelections } = req.body; // Extract Beyonders specific data

        // Verify assignment belongs to candidate
        const assignmentResult = await pool.query(
            `SELECT * FROM assignments 
             WHERE id = $1 AND (user_id = $2 OR email = $3)`,
            [assignmentId, req.user.id, req.user.email]
        );

        const assignment = assignmentResult.rows[0];

        if (!assignment) {
            return res.status(404).json({
                success: false,
                error: 'Assignment not found',
            });
        }

        if (assignment.status === 'submitted') {
            return res.status(400).json({
                success: false,
                error: 'Test already submitted',
            });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Save response
            const responseResult = await client.query(
                `INSERT INTO responses (
                    assignment_id, 
                    responses_json, 
                    score_json,
                    detailed_scores,
                    test_start_time,
                    test_completion_time,
                    is_auto_submit,
                    questions_answered
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id`,
                [
                    assignmentId,
                    JSON.stringify({ narrativeResponses, cardSelections }), // Store raw responses
                    JSON.stringify(scores), // Store calculated scores
                    JSON.stringify(testMetrics), // Store metrics
                    testMetrics?.startTime || new Date(),
                    testMetrics?.completionTime || new Date(),
                    testMetrics?.isAutoSubmit || false,
                    cardSelections?.length || 0
                ]
            );

            // Update assignment status
            await client.query(
                `UPDATE assignments 
                 SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP 
                 WHERE id = $1`,
                [assignmentId]
            );

            await client.query('COMMIT');

            res.json({
                success: true,
                responseId: responseResult.rows[0].id,
                message: 'Test submitted successfully'
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Submit adaptive test error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit test'
        });
    }
});

// ============================================
// CANDIDATE STATUS & VERIFICATION GATES
// ============================================

/**
 * GET /api/candidate/status
 * Get candidate's verification status (email verified, profile completed)
 */
router.get('/status', requireAuth, requireCandidate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT email_verified, profile_completed FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = result.rows[0];
        const canTakeTests = user.email_verified === true && user.profile_completed === true;

        res.json({
            success: true,
            status: {
                emailVerified: user.email_verified === true,
                profileCompleted: user.profile_completed === true,
                canTakeTests,
            }
        });
    } catch (error) {
        console.error('Get candidate status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get status'
        });
    }
});

module.exports = router;

