/**
 * Database Service Layer
 * Provides abstraction for all database operations
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://atria_admin:atria_secure_2024@localhost:4904/atria360';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

// Create connection pool
const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ Database connected');
});

pool.on('error', (err) => {
    console.error('❌ Database error:', err);
});

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Get user by email
 */
async function getUserByEmail(email) {
    const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );
    return result.rows[0] || null;
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
    const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
    );
    return result.rows[0] || null;
}

/**
 * Get user with roles
 */
async function getUserWithRoles(userId) {
    const result = await pool.query(
        `SELECT u.*, ARRAY_AGG(r.name) as roles
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.id
     WHERE u.id = $1
     GROUP BY u.id`,
        [userId]
    );
    return result.rows[0] || null;
}

/**
 * Create a new user
 */
async function createUser(userData) {
    const {
        email,
        name,
        phone,
        password,
        role = 'CANDIDATE',
        // StudentInfo fields
        dateOfBirth,
        institution,
        boardOfStudy,
        parentName,
        parentOccupation,
        annualIncome,
        fullAddress,
        locationLatitude,
        locationLongitude,
        locationAddress,
        tenthGrade,
        eleventhGrade,
        extracurricular,
        interests,
        signature,
        termsAccepted,
    } = userData;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Hash password if provided
        let passwordHash = null;
        if (password) {
            passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        }

        // Insert user
        const userResult = await client.query(
            `INSERT INTO users (
        email, name, phone, password_hash,
        date_of_birth, institution, board_of_study,
        parent_name, parent_occupation, annual_income, full_address,
        location_latitude, location_longitude, location_address,
        tenth_grade, eleventh_grade, extracurricular, interests,
        signature, terms_accepted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
            [
                email, name, phone, passwordHash,
                dateOfBirth, institution, boardOfStudy,
                parentName, parentOccupation, annualIncome, fullAddress,
                locationLatitude, locationLongitude, locationAddress,
                tenthGrade ? JSON.stringify(tenthGrade) : null,
                eleventhGrade ? JSON.stringify(eleventhGrade) : null,
                extracurricular ? JSON.stringify(extracurricular) : null,
                interests ? JSON.stringify(interests) : null,
                signature, termsAccepted
            ]
        );

        const user = userResult.rows[0];

        // Assign role
        const roleResult = await client.query(
            'SELECT id FROM roles WHERE name = $1',
            [role]
        );

        if (roleResult.rows.length > 0) {
            await client.query(
                'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
                [user.id, roleResult.rows[0].id]
            );
        }

        await client.query('COMMIT');
        return user;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Update user
 */
async function updateUser(userId, updates) {
    const allowedFields = [
        'name', 'phone', 'status', 'date_of_birth', 'institution',
        'board_of_study', 'parent_name', 'parent_occupation', 'annual_income',
        'full_address', 'location_latitude', 'location_longitude', 'location_address',
        'tenth_grade', 'eleventh_grade', 'extracurricular', 'interests', 'signature', 'terms_accepted'
    ];

    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
            fields.push(`${key} = $${paramCount}`);
            values.push(value);
            paramCount++;
        }
    }

    if (fields.length === 0) {
        return null;
    }

    values.push(userId);
    const result = await pool.query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
        values
    );

    return result.rows[0] || null;
}

/**
 * List all users with pagination
 */
async function listUsers({ page = 1, limit = 50, status = null, role = null }) {
    const offset = (page - 1) * limit;

    let query = `
    SELECT u.*, ARRAY_AGG(r.name) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
  `;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (status) {
        conditions.push(`u.status = $${paramCount}`);
        params.push(status);
        paramCount++;
    }

    if (role) {
        conditions.push(`r.name = $${paramCount}`);
        params.push(role);
        paramCount++;
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM users');

    return {
        users: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
}

/**
 * Verify user password
 */
async function verifyPassword(email, password) {
    const user = await getUserByEmail(email);
    if (!user || !user.password_hash) {
        return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
}

/**
 * Update user password
 */
async function updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, userId]
    );
}

/**
 * Update last login timestamp
 */
async function updateLastLogin(userId) {
    await pool.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
    );
}

// ============================================
// TEST OPERATIONS
// ============================================

/**
 * Create a new test
 */
async function createTest(testData) {
    const { title, description, type, configJson, durationMinutes, createdBy } = testData;

    const result = await pool.query(
        `INSERT INTO tests (title, description, type, config_json, duration_minutes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
        [title, description, type, configJson ? JSON.stringify(configJson) : null, durationMinutes, createdBy]
    );

    return result.rows[0];
}

/**
 * Get test by ID
 */
async function getTestById(testId) {
    const result = await pool.query(
        'SELECT * FROM tests WHERE id = $1',
        [testId]
    );
    return result.rows[0] || null;
}

/**
 * List all tests
 */
async function listTests({ isActive = null } = {}) {
    let query = 'SELECT * FROM tests';
    const params = [];

    if (isActive !== null) {
        query += ' WHERE is_active = $1';
        params.push(isActive);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
}

/**
 * Update test
 */
async function updateTest(testId, updates) {
    const allowedFields = ['title', 'description', 'config_json', 'duration_minutes', 'is_active'];

    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
            fields.push(`${key} = $${paramCount}`);
            values.push(key === 'config_json' && value ? JSON.stringify(value) : value);
            paramCount++;
        }
    }

    if (fields.length === 0) {
        return null;
    }

    values.push(testId);
    const result = await pool.query(
        `UPDATE tests SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
        values
    );

    return result.rows[0] || null;
}

// ============================================
// ASSIGNMENT OPERATIONS
// ============================================

/**
 * Create assignment
 */
async function createAssignment(assignmentData) {
    const { testId, userId, dueAt, assignedBy } = assignmentData;

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
        `INSERT INTO assignments (test_id, user_id, due_at, attempt_token_hash, assigned_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [testId, userId, dueAt, tokenHash, assignedBy]
    );

    // Return assignment with plain token (only time it's available)
    return {
        ...result.rows[0],
        token, // Include token for email link
    };
}

/**
 * Get assignment by ID
 */
async function getAssignmentById(assignmentId) {
    const result = await pool.query(
        `SELECT a.*, u.name as user_name, u.email as user_email, 
            t.title as test_title, t.description, t.type, t.duration_minutes, t.config_json
     FROM assignments a
     JOIN users u ON a.user_id = u.id
     JOIN tests t ON a.test_id = t.id
     WHERE a.id = $1`,
        [assignmentId]
    );
    return result.rows[0] || null;
}

/**
 * Get assignment by token
 */
async function getAssignmentByToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
        `SELECT a.*, u.name as user_name, u.email as user_email, 
            t.title as test_title, t.description, t.type, t.duration_minutes, t.config_json
     FROM assignments a
     JOIN users u ON a.user_id = u.id
     JOIN tests t ON a.test_id = t.id
     WHERE a.attempt_token_hash = $1 AND a.status != 'expired'`,
        [tokenHash]
    );

    return result.rows[0] || null;
}

/**
 * Get user assignments
 */
async function getUserAssignments(userId) {
    const result = await pool.query(
        `SELECT a.*, t.title, t.description, t.type, t.duration_minutes, t.config_json, r.id as response_id
     FROM assignments a
     JOIN tests t ON a.test_id = t.id
     LEFT JOIN responses r ON r.assignment_id = a.id
     WHERE a.user_id = $1
     ORDER BY a.assigned_at DESC`,
        [userId]
    );
    return result.rows;
}

/**
 * Update assignment status
 */
async function updateAssignmentStatus(assignmentId, status, additionalData = {}) {
    const fields = ['status = $1'];
    const values = [status];

    if (status === 'started' && !additionalData.started_at) {
        fields.push('started_at = CURRENT_TIMESTAMP');
    } else if (additionalData.started_at) {
        values.push(additionalData.started_at);
        fields.push(`started_at = $${values.length}`);
    }

    if (status === 'submitted' && !additionalData.submitted_at) {
        fields.push('submitted_at = CURRENT_TIMESTAMP');
    } else if (additionalData.submitted_at) {
        values.push(additionalData.submitted_at);
        fields.push(`submitted_at = $${values.length}`);
    }

    // Add assignmentId as the last parameter
    values.push(assignmentId);
    const idParamIndex = values.length;

    const result = await pool.query(
        `UPDATE assignments SET ${fields.join(', ')}
     WHERE id = $${idParamIndex}
     RETURNING *`,
        values
    );

    return result.rows[0] || null;
}

/**
 * List all assignments with filters
 */
async function listAssignments({ testId = null, userId = null, status = null } = {}) {
    let query = `
    SELECT a.*, u.name as user_name, u.email as user_email, t.title as test_title
    FROM assignments a
    JOIN users u ON a.user_id = u.id
    JOIN tests t ON a.test_id = t.id
  `;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (testId) {
        conditions.push(`a.test_id = $${paramCount}`);
        params.push(testId);
        paramCount++;
    }

    if (userId) {
        conditions.push(`a.user_id = $${paramCount}`);
        params.push(userId);
        paramCount++;
    }

    if (status) {
        conditions.push(`a.status = $${paramCount}`);
        params.push(status);
        paramCount++;
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.assigned_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
}

// ============================================
// RESPONSE OPERATIONS
// ============================================

/**
 * Create response
 */
async function createResponse(responseData) {
    const {
        assignmentId,
        responsesJson,
        scoreJson,
        executingScore,
        influencingScore,
        relationshipBuildingScore,
        strategicThinkingScore,
        primaryTalentDomain,
        detailedScores,
        testStartTime,
        testCompletionTime,
        testViolations,
        isAutoSubmit,
        questionsAnswered,
    } = responseData;

    const result = await pool.query(
        `INSERT INTO responses (
      assignment_id, responses_json, score_json,
      executing_score, influencing_score, relationship_building_score, strategic_thinking_score,
      primary_talent_domain, detailed_scores,
      test_start_time, test_completion_time, test_violations,
      is_auto_submit, questions_answered
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
        [
            assignmentId,
            JSON.stringify(responsesJson),
            scoreJson ? JSON.stringify(scoreJson) : null,
            executingScore,
            influencingScore,
            relationshipBuildingScore,
            strategicThinkingScore,
            primaryTalentDomain,
            detailedScores ? JSON.stringify(detailedScores) : null,
            testStartTime,
            testCompletionTime,
            testViolations ? JSON.stringify(testViolations) : null,
            isAutoSubmit,
            questionsAnswered,
        ]
    );

    return result.rows[0];
}

/**
 * Get response by assignment ID
 */
async function getResponseByAssignmentId(assignmentId) {
    const result = await pool.query(
        'SELECT * FROM responses WHERE assignment_id = $1',
        [assignmentId]
    );
    return result.rows[0] || null;
}

/**
 * Get response by ID
 */
async function getResponseById(responseId) {
    const query = `
        SELECT r.*, a.test_id, a.user_id, u.name as user_name, u.email as user_email, t.title as test_title, t.type as test_type
        FROM responses r
        JOIN assignments a ON r.assignment_id = a.id
        JOIN users u ON a.user_id = u.id
        JOIN tests t ON a.test_id = t.id
        WHERE r.id = $1
    `;
    const result = await pool.query(query, [responseId]);
    return result.rows[0] || null;
}

/**
 * List all responses with filters
 */
async function listResponses({ testId = null, userId = null } = {}) {
    let query = `
    SELECT r.*, a.test_id, a.user_id, u.name as user_name, u.email as user_email, t.title as test_title
    FROM responses r
    JOIN assignments a ON r.assignment_id = a.id
    JOIN users u ON a.user_id = u.id
    JOIN tests t ON a.test_id = t.id
  `;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (testId) {
        conditions.push(`a.test_id = $${paramCount}`);
        params.push(testId);
        paramCount++;
    }

    if (userId) {
        conditions.push(`a.user_id = $${paramCount}`);
        params.push(userId);
        paramCount++;
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.submitted_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
}

// ============================================
// EMAIL QUEUE OPERATIONS
// ============================================

/**
 * Queue an email
 */
async function queueEmail(emailData) {
    const {
        toEmail,
        subject,
        bodyHtml,
        bodyText,
        templateName,
        templateData,
        scheduledAt,
    } = emailData;

    const result = await pool.query(
        `INSERT INTO email_queue (to_email, subject, body_html, body_text, template_name, template_data, scheduled_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
        [
            toEmail,
            subject,
            bodyHtml,
            bodyText,
            templateName,
            templateData ? JSON.stringify(templateData) : null,
            scheduledAt || new Date(),
        ]
    );

    return result.rows[0];
}

// ============================================
// INVITATION OPERATIONS
// ============================================

/**
 * Create invitation
 */
async function createInvitation(email, createdBy, expiresInDays = 7) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const result = await pool.query(
        `INSERT INTO invitations (email, token_hash, expires_at, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
        [email, tokenHash, expiresAt, createdBy]
    );

    return {
        ...result.rows[0],
        token, // Return plain token for email link
    };
}

/**
 * Get invitation by token
 */
async function getInvitationByToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
        `SELECT * FROM invitations 
     WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP AND used_at IS NULL`,
        [tokenHash]
    );

    return result.rows[0] || null;
}

/**
 * Mark invitation as used
 */
async function markInvitationUsed(invitationId, userId) {
    await pool.query(
        'UPDATE invitations SET used_at = CURRENT_TIMESTAMP, user_id = $1 WHERE id = $2',
        [userId, invitationId]
    );
}

// ============================================
// AUDIT LOG OPERATIONS
// ============================================

/**
 * Log admin action
 */
async function logAuditAction(auditData) {
    const { userId, action, entityType, entityId, details, ipAddress, userAgent } = auditData;

    await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            userId,
            action,
            entityType,
            entityId,
            details ? JSON.stringify(details) : null,
            ipAddress,
            userAgent,
        ]
    );
}

/**
 * Get audit logs
 */
async function getAuditLogs({ userId = null, action = null, limit = 100 } = {}) {
    let query = 'SELECT * FROM audit_logs';
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (userId) {
        conditions.push(`user_id = $${paramCount}`);
        params.push(userId);
        paramCount++;
    }

    if (action) {
        conditions.push(`action = $${paramCount}`);
        params.push(action);
        paramCount++;
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get dashboard statistics
 */
async function getDashboardStats() {
    const stats = {};

    // Total users
    const usersResult = await pool.query('SELECT COUNT(*) FROM users WHERE status = $1', ['active']);
    stats.totalUsers = parseInt(usersResult.rows[0].count);

    // Total tests
    const testsResult = await pool.query('SELECT COUNT(*) FROM tests WHERE is_active = true');
    stats.totalTests = parseInt(testsResult.rows[0].count);

    // Total assignments
    const assignmentsResult = await pool.query('SELECT COUNT(*) FROM assignments');
    stats.totalAssignments = parseInt(assignmentsResult.rows[0].count);

    // Completed tests
    const completedResult = await pool.query('SELECT COUNT(*) FROM assignments WHERE status = $1', ['submitted']);
    stats.completedTests = parseInt(completedResult.rows[0].count);

    // Pending tests
    const pendingResult = await pool.query('SELECT COUNT(*) FROM assignments WHERE status = $1', ['assigned']);
    stats.pendingTests = parseInt(pendingResult.rows[0].count);

    // Primary domain breakdown
    const domainResult = await pool.query(
        `SELECT primary_talent_domain, COUNT(*) as count
     FROM responses
     WHERE primary_talent_domain IS NOT NULL
     GROUP BY primary_talent_domain`
    );
    stats.domainBreakdown = domainResult.rows.reduce((acc, row) => {
        acc[row.primary_talent_domain] = parseInt(row.count);
        return acc;
    }, {});

    return stats;
}

// ============================================
// EXPORTS
// ============================================

// Export all functions
module.exports = {
    pool,
    // User operations
    getUserByEmail,
    getUserById,
    getUserWithRoles,
    createUser,
    updateUser,
    listUsers,
    verifyPassword,
    updatePassword,
    updateLastLogin,
    // Test operations
    createTest,
    getTestById,
    listTests,
    updateTest,
    // Assignment operations
    createAssignment,
    getAssignmentById,
    getAssignmentByToken,
    getUserAssignments,
    updateAssignmentStatus,
    listAssignments,
    // Response operations
    createResponse,
    getResponseById,
    getResponseByAssignmentId,
    listResponses,
    // Email operations
    queueEmail,
    // Invitation operations
    createInvitation,
    getInvitationByToken,
    markInvitationUsed,
    // Audit operations
    logAuditAction,
    getAuditLogs,
    // Statistics
    getDashboardStats,
    // Password Reset
    createPasswordResetToken: createInvitation, // Reuse invitation logic
    verifyPasswordResetToken: getInvitationByToken, // Reuse invitation logic
};
// No Groq API keys or secrets are present in this file. No changes needed.
