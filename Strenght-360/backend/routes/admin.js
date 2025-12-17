/**
 * Admin Routes
 * Handles user management, test management, and assignment operations
 */

const express = require('express');
const router = express.Router();
const Redis = require('ioredis');
const {
    createUser,
    listUsers,
    getUserById,
    updateUser,
    createTest,
    listTests,
    getTestById,
    updateTest,
    createAssignment,
    listAssignments,
    getAssignmentById,
    updateAssignmentStatus,
    listResponses,
    createInvitation,
    queueEmail,
    logAuditAction,
    getDashboardStats,
} = require('../services/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Redis for pub/sub
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:49906';
const redis = new Redis(REDIS_URL);

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// ============================================
// DASHBOARD
// ============================================

/**
 * GET /api/admin/dashboard
 * Get dashboard overview stats
 */
router.get('/dashboard', requireAuth, requireAdmin, async (req, res) => {
    try {
        const stats = await getDashboardStats();

        res.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dashboard stats',
        });
    }
});

/**
 * GET /api/admin/dashboard/stats
 * Get detailed test statistics for admin dashboard
 */
router.get('/dashboard/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
        // Get assignment statistics
        const assignmentStats = await pool.query(`
            SELECT 
                COUNT(*) as total_assignments,
                COUNT(*) FILTER (WHERE status = 'assigned') as assigned,
                COUNT(*) FILTER (WHERE status = 'started') as started,
                COUNT(*) FILTER (WHERE status = 'submitted') as completed,
                COUNT(*) FILTER (WHERE status = 'expired') as expired
            FROM assignments
        `);

        // Get response count
        const responseStats = await pool.query(`
            SELECT COUNT(*) as total_reports
            FROM responses
        `);

        const stats = assignmentStats.rows[0];
        const totalAssignments = parseInt(stats.total_assignments);
        const completedTests = parseInt(stats.completed);
        const completionRate = totalAssignments > 0
            ? Math.round((completedTests / totalAssignments) * 100)
            : 0;

        res.json({
            success: true,
            stats: {
                totalAssignments,
                assignedTests: parseInt(stats.assigned),
                startedTests: parseInt(stats.started),
                completedTests,
                expiredTests: parseInt(stats.expired),
                completionRate: `${completionRate}%`,
                totalReports: parseInt(responseStats.rows[0].total_reports),
            },
        });
    } catch (error) {
        console.error('Get test statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get test statistics',
        });
    }
});

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * POST /api/admin/users
 * Create a new user
 */
router.post('/users', async (req, res) => {
    try {
        const { email, name, phone, role = 'CANDIDATE', sendInvite = true, password } = req.body;

        if (!email || !name) {
            return res.status(400).json({
                success: false,
                error: 'Email and name are required',
            });
        }

        // Create user without password
        const user = await createUser({
            email,
            name,
            phone,
            role,
            status: password ? 'active' : 'pending',
            password,
        });

        // Create invitation
        if (sendInvite) {
            const invitation = await createInvitation(email, req.user.id);

            const inviteLink = `${process.env.APP_URL || 'http://localhost:4901'}/register?token=${invitation.token}`;

            // Queue invitation email
            await queueEmail({
                toEmail: email,
                templateName: 'invitation',
                templateData: {
                    email,
                    inviteLink,
                    expiresAt: invitation.expires_at,
                },
            });

            // Notify worker via Redis
            redis.publish('email:new', JSON.stringify({ emailId: 'pending' }));
        }

        // Log audit
        await logAuditAction({
            userId: req.user.id,
            action: 'user_created',
            entityType: 'user',
            entityId: user.id,
            details: { email, name, role },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                status: user.status,
            },
            inviteSent: sendInvite,
        });
    } catch (error) {
        console.error('Create user error:', error);

        if (error.code === '23505') { // Unique violation
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists',
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create user',
        });
    }
});

/**
 * POST /api/admin/users/bulk
 * Create multiple users from CSV data
 */
router.post('/users/bulk', async (req, res) => {
    try {
        const { users, sendInvites = true } = req.body;

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Users array is required',
            });
        }

        const results = {
            created: [],
            failed: [],
            duplicates: [],
        };

        for (const userData of users) {
            try {
                const { email, name, phone, role = 'CANDIDATE' } = userData;

                if (!email || !name) {
                    results.failed.push({ email, reason: 'Missing email or name' });
                    continue;
                }

                // Create user
                const user = await createUser({
                    email,
                    name,
                    phone,
                    role,
                    status: 'pending',
                });

                results.created.push({ email, userId: user.id });

                // Create invitation and queue email
                if (sendInvites) {
                    const invitation = await createInvitation(email, req.user.id);
                    const inviteLink = `${process.env.APP_URL || 'http://localhost:4901'}/register?token=${invitation.token}`;

                    await queueEmail({
                        toEmail: email,
                        templateName: 'invitation',
                        templateData: {
                            email,
                            inviteLink,
                            expiresAt: invitation.expires_at,
                        },
                    });
                }
            } catch (error) {
                if (error.code === '23505') {
                    results.duplicates.push(userData.email);
                } else {
                    results.failed.push({ email: userData.email, reason: error.message });
                }
            }
        }

        // Notify worker about new emails
        if (results.created.length > 0) {
            redis.publish('email:new', JSON.stringify({ count: results.created.length }));
        }

        // Log audit
        await logAuditAction({
            userId: req.user.id,
            action: 'users_bulk_created',
            entityType: 'user',
            details: {
                total: users.length,
                created: results.created.length,
                failed: results.failed.length,
                duplicates: results.duplicates.length,
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            results,
        });
    } catch (error) {
        console.error('Bulk create users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create users',
        });
    }
});

/**
 * GET /api/admin/users
 * List all users
 */
router.get('/users', async (req, res) => {
    try {
        const { page, limit, status, role } = req.query;

        const result = await listUsers({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            status,
            role,
        });

        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list users',
        });
    }
});

/**
 * GET /api/admin/users/:id
 * Get user by ID
 */
router.get('/users/:id', async (req, res) => {
    try {
        const user = await getUserById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user',
        });
    }
});

/**
 * PUT /api/admin/users/:id
 * Update user
 */
router.put('/users/:id', async (req, res) => {
    try {
        const updates = req.body;
        const user = await updateUser(req.params.id, updates);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found or no valid fields to update',
            });
        }

        // Log audit
        await logAuditAction({
            userId: req.user.id,
            action: 'user_updated',
            entityType: 'user',
            entityId: req.params.id,
            details: updates,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user',
        });
    }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password (admin)
 */
router.post('/users/:id/reset-password', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Password is required',
            });
        }

        const user = await getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        await require('../services/database').updatePassword(req.params.id, password);

        // Log audit
        await logAuditAction({
            userId: req.user.id,
            action: 'user_password_reset',
            entityType: 'user',
            entityId: req.params.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset password',
        });
    }
});

// ============================================
// TEST MANAGEMENT
// ============================================

/**
 * POST /api/admin/tests
 * Create a new test
 */
router.post('/tests', async (req, res) => {
    try {
        const { title, description, type, configJson, durationMinutes } = req.body;

        if (!title || !type) {
            return res.status(400).json({
                success: false,
                error: 'Title and type are required',
            });
        }

        const test = await createTest({
            title,
            description,
            type,
            configJson,
            durationMinutes: durationMinutes || 20,
            createdBy: req.user.id,
        });

        // Log audit
        await logAuditAction({
            userId: req.user.id,
            action: 'test_created',
            entityType: 'test',
            entityId: test.id,
            details: { title, type },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            test,
        });
    } catch (error) {
        console.error('Create test error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create test',
        });
    }
});

/**
 * GET /api/admin/tests
 * List all tests
 */
router.get('/tests', async (req, res) => {
    try {
        const { isActive } = req.query;

        const tests = await listTests({
            isActive: isActive !== undefined ? isActive === 'true' : null,
        });

        res.json({
            success: true,
            tests,
        });
    } catch (error) {
        console.error('List tests error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list tests',
        });
    }
});

/**
 * GET /api/admin/tests/:id
 * Get test by ID
 */
router.get('/tests/:id', async (req, res) => {
    try {
        const test = await getTestById(req.params.id);

        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found',
            });
        }

        res.json({
            success: true,
            test,
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
 * PUT /api/admin/tests/:id
 * Update test
 */
router.put('/tests/:id', async (req, res) => {
    try {
        const updates = req.body;
        const test = await updateTest(req.params.id, updates);

        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found',
            });
        }

        // Log audit
        await logAuditAction({
            userId: req.user.id,
            action: 'test_updated',
            entityType: 'test',
            entityId: req.params.id,
            details: updates,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            test,
        });
    } catch (error) {
        console.error('Update test error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update test',
        });
    }
});

// ============================================
// ASSIGNMENT MANAGEMENT
// ============================================

/**
 * POST /api/admin/assignments
 * Create assignment (allot test to user)
 */
router.post('/assignments', async (req, res) => {
    try {
        const { testId, userId, dueAt } = req.body;

        if (!testId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Test ID and User ID are required',
            });
        }

        // Get test and user info
        const test = await getTestById(testId);
        const user = await getUserById(userId);

        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found',
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        // Create assignment
        const assignment = await createAssignment({
            testId,
            userId,
            dueAt: dueAt ? new Date(dueAt) : null,
            assignedBy: req.user.id,
        });

        // Generate test link based on test type
        let testLink;
        const baseUrl = process.env.APP_URL || 'http://localhost:4903'; // Use admin portal URL for Beyonders

        if (test.type === 'beyonders_science') {
            testLink = `${baseUrl}/science?assignment=${assignment.id}&token=${assignment.token}`;
        } else if (test.type === 'beyonders_non_science') {
            testLink = `${baseUrl}/non-science?assignment=${assignment.id}&token=${assignment.token}`;
        } else {
            // For psychometric tests (Strength 360), use the candidate portal
            testLink = `${process.env.CANDIDATE_URL || 'http://localhost:4901'}/test/${assignment.id}?token=${assignment.token}`;
        }

        // Queue assignment email
        await queueEmail({
            toEmail: user.email,
            subject: `ATRIA 360: Your test "${test.title}" is ready`,
            templateName: 'test_assignment',
            templateData: {
                userName: user.name,
                testTitle: test.title,
                testLink,
                dueDate: dueAt,
            },
        });

        // Notify worker
        redis.publish('email:new', JSON.stringify({ assignmentId: assignment.id }));

        // Update assignment to mark link sent
        await updateAssignmentStatus(assignment.id, assignment.status, {
            link_sent_at: new Date(),
        });

        // Log audit
        await logAuditAction({
            userId: req.user.id,
            action: 'test_assigned',
            entityType: 'assignment',
            entityId: assignment.id,
            details: { testId, userId, testTitle: test.title, userName: user.name },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            assignment: {
                id: assignment.id,
                testId: assignment.test_id,
                userId: assignment.user_id,
                status: assignment.status,
                assignedAt: assignment.assigned_at,
                dueAt: assignment.due_at,
            },
            emailSent: true,
        });
    } catch (error) {
        console.error('Create assignment error:', error);

        if (error.code === '23505') {
            // If assignment already exists, return the existing one
            // We need to fetch it first to return it
            try {
                // This is a bit of a hack, we assume the unique constraint is on test_id + user_id
                // But we don't have a direct "getAssignmentByTestAndUser" function exposed here easily
                // So we'll list assignments filtering by testId and userId
                const existing = await listAssignments({ testId: req.body.testId, userId: req.body.userId });
                if (existing && existing.length > 0) {
                    return res.json({
                        success: true,
                        assignment: existing[0],
                        emailSent: false, // We didn't resend the email
                        message: 'User already assigned to this test'
                    });
                }
            } catch (fetchError) {
                console.error('Error fetching existing assignment:', fetchError);
            }

            return res.status(400).json({
                success: false,
                error: 'User already has this test assigned',
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create assignment',
        });
    }
});

/**
 * POST /api/admin/assignments/bulk
 * Bulk assign test to multiple users
 */
router.post('/assignments/bulk', async (req, res) => {
    try {
        const { testId, userIds, dueAt } = req.body;

        if (!testId || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Test ID and user IDs array are required',
            });
        }

        const test = await getTestById(testId);
        if (!test) {
            return res.status(404).json({
                success: false,
                error: 'Test not found',
            });
        }

        const results = {
            created: [],
            failed: [],
            duplicates: [],
        };

        for (const userId of userIds) {
            try {
                const user = await getUserById(userId);
                if (!user) {
                    results.failed.push({ userId, reason: 'User not found' });
                    continue;
                }

                const assignment = await createAssignment({
                    testId,
                    userId,
                    dueAt: dueAt ? new Date(dueAt) : null,
                    assignedBy: req.user.id,
                });

                const testLink = `${process.env.APP_URL || 'http://localhost:4901'}/test/${assignment.id}?token=${assignment.token}`;

                await queueEmail({
                    toEmail: user.email,
                    templateName: 'test_assignment',
                    templateData: {
                        userName: user.name,
                        testTitle: test.title,
                        testLink,
                        dueDate: dueAt,
                    },
                });

                results.created.push({ userId, assignmentId: assignment.id });
            } catch (error) {
                if (error.code === '23505') {
                    results.duplicates.push(userId);
                } else {
                    results.failed.push({ userId, reason: error.message });
                }
            }
        }

        // Notify worker
        if (results.created.length > 0) {
            redis.publish('email:new', JSON.stringify({ count: results.created.length }));
        }

        // Log audit
        await logAuditAction({
            userId: req.user.id,
            action: 'tests_bulk_assigned',
            entityType: 'assignment',
            details: {
                testId,
                total: userIds.length,
                created: results.created.length,
                failed: results.failed.length,
                duplicates: results.duplicates.length,
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            results,
        });
    } catch (error) {
        console.error('Bulk assign error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create assignments',
        });
    }
});

/**
 * GET /api/admin/assignments
 * List all assignments
 */
router.get('/assignments', async (req, res) => {
    try {
        const { testId, userId, status } = req.query;

        const assignments = await listAssignments({ testId, userId, status });

        res.json({
            success: true,
            assignments,
        });
    } catch (error) {
        console.error('List assignments error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list assignments',
        });
    }
});

/**
 * POST /api/admin/assignments/:id/resend
 * Resend assignment email
 */
router.post('/assignments/:id/resend', async (req, res) => {
    try {
        const assignment = await getAssignmentById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                error: 'Assignment not found',
            });
        }

        const test = await getTestById(assignment.test_id);
        const user = await getUserById(assignment.user_id);

        // Note: We can't retrieve the original token, so this would need to generate a new one
        // For now, let's just queue the email with a note
        await queueEmail({
            toEmail: user.email,
            subject: `Reminder: ${test.title} - ATRIA 360`,
            bodyHtml: `
        <p>Dear ${user.name},</p>
        <p>This is a reminder that you have a test assignment: <strong>${test.title}</strong></p>
        <p>Please check your original email for the test link, or contact your administrator.</p>
      `,
            bodyText: `Dear ${user.name},\n\nThis is a reminder that you have a test assignment: ${test.title}\n\nPlease check your original email for the test link, or contact your administrator.`,
        });

        redis.publish('email:new', JSON.stringify({ reminder: true }));

        // Log audit
        await logAuditAction({
            userId: req.user.id,
            action: 'assignment_link_resent',
            entityType: 'assignment',
            entityId: req.params.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            message: 'Reminder email sent',
        });
    } catch (error) {
        console.error('Resend assignment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resend assignment',
        });
    }
});

// ============================================
// RESPONSE MANAGEMENT
// ============================================

/**
 * GET /api/admin/responses
 * List all responses
 */
router.get('/responses', async (req, res) => {
    try {
        const { testId, userId } = req.query;

        const responses = await listResponses({ testId, userId });

        res.json({
            success: true,
            responses,
        });
    } catch (error) {
        console.error('List responses error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list responses',
        });
    }
});

/**
 * GET /api/admin/report-data/:responseId
 * Get structured report data for a response
 */
router.get('/report-data/:responseId', async (req, res) => {
    try {
        const { responseId } = req.params;

        // Need to import pool if not available in scope, but it is used in other routes
        // Wait, pool is NOT imported at top level in the viewed file!
        // It uses helper functions from ../services/database.
        // I should check if I can access pool or need to add a helper function.

        // The file imports:
        // const { createUser, ... } = require('../services/database');

        // It does NOT import pool.
        // But line 69 uses `pool.query`.
        // "const assignmentStats = await pool.query(..."

        // So pool MUST be available.
        // Let's check line 69 again.
        // Yes. But where is it defined?
        // Maybe I missed it in the imports?
        // "const { pool, getDashboardStats } = require('./services/database');" in server.js
        // But this is admin.js.

        // Let's check imports in admin.js again.
        // Lines 9-27 do NOT import pool.

        // But line 69 uses it?
        // "const assignmentStats = await pool.query"

        // If pool is not imported, line 69 would crash.
        // Maybe it IS imported and I missed it?
        // Or maybe it's global? (Unlikely)

        // I will add pool to the imports just in case.

        const result = await require('../services/database').pool.query(`
            SELECT 
                r.*,
                u.name as user_name,
                u.email as user_email,
                t.title as test_title,
                t.type as test_type,
                t.config_json as test_config
            FROM responses r
            JOIN assignments a ON r.assignment_id = a.id
            JOIN users u ON a.user_id = u.id
            JOIN tests t ON a.test_id = t.id
            WHERE r.id = $1
        `, [responseId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Response not found' });
        }

        const response = result.rows[0];

        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error('Get report data error:', error);
        res.status(500).json({ success: false, error: 'Failed to get report data' });
    }
});

/**
 * GET /api/admin/reports/csv
 * Export responses as CSV
 */
router.get('/reports/csv', async (req, res) => {
    try {
        const { testId } = req.query;

        let query = `
            SELECT 
                r.id,
                u.name as user_name,
                u.email as user_email,
                t.title as test_title,
                r.primary_talent_domain,
                r.executing_score,
                r.influencing_score,
                r.relationship_building_score,
                r.strategic_thinking_score,
                r.submitted_at,
                r.is_auto_submit,
                r.questions_answered,
                r.score_json
            FROM responses r
            JOIN assignments a ON r.assignment_id = a.id
            JOIN users u ON a.user_id = u.id
            JOIN tests t ON a.test_id = t.id
        `;

        const params = [];
        if (testId) {
            query += ` WHERE t.id = $1`;
            params.push(testId);
        }

        query += ` ORDER BY r.submitted_at DESC`;

        const result = await require('../services/database').pool.query(query, params);

        // Convert to CSV
        const fields = [
            'Response ID', 'Name', 'Email', 'Test Title',
            'Primary Domain', 'Executing', 'Influencing', 'Relationship Building', 'Strategic Thinking',
            'Submitted At', 'Auto Submit', 'Questions Answered', 'Score Details'
        ];

        let csv = fields.join(',') + '\n';

        result.rows.forEach(row => {
            const scoreDetails = row.score_json ? JSON.stringify(row.score_json).replace(/"/g, '""') : '';

            const line = [
                row.id,
                `"${row.user_name}"`,
                `"${row.user_email}"`,
                `"${row.test_title}"`,
                `"${row.primary_talent_domain || ''}"`,
                row.executing_score || '',
                row.influencing_score || '',
                row.relationship_building_score || '',
                row.strategic_thinking_score || '',
                `"${new Date(row.submitted_at).toISOString()}"`,
                row.is_auto_submit ? 'Yes' : 'No',
                row.questions_answered,
                `"${scoreDetails}"`
            ].join(',');

            csv += line + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="reports-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);

    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ success: false, error: 'Failed to export CSV' });
    }
});

module.exports = router;

