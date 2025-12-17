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
        res.json({
            success: true,
            assignments,
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
                testType: assignment.type,
                config: assignment.config_json,
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
                    JSON.stringify(scores || {
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

module.exports = router;

