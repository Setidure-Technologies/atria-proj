/**
 * Authentication Routes
 * Handles login, registration, and token management
 */

const express = require('express');
const router = express.Router();
const {
    getUserByEmail,
    verifyPassword,
    createUser,
    updateLastLogin,
    updatePassword,
    getInvitationByToken,
    markInvitationUsed,
    logAuditAction,
} = require('../services/database');
const { generateToken, requireAuth } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
        }

        // Verify credentials
        const user = await verifyPassword(email, password);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'Your account is disabled. Please contact admin.',
            });
        }

        // Update last login
        await updateLastLogin(user.id);

        // Generate token
        const token = generateToken(user);

        // Log audit
        await logAuditAction({
            userId: user.id,
            action: 'user_login',
            entityType: 'user',
            entityId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                status: user.status,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
        });
    }
});

/**
 * POST /api/auth/register
 * Register new user via invitation
 */
router.post('/register', async (req, res) => {
    try {
        const { token, password, name, phone } = req.body;

        if (!token || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'Token, name, and password are required',
            });
        }

        // Verify invitation token
        const invitation = await getInvitationByToken(token);
        if (!invitation) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired invitation token',
            });
        }

        // Check if user already exists
        const existingUser = await getUserByEmail(invitation.email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User already exists',
            });
        }

        // Create user
        const user = await createUser({
            email: invitation.email,
            name,
            phone,
            password,
            role: 'CANDIDATE',
            termsAccepted: true,
        });

        // Mark invitation as used
        await markInvitationUsed(invitation.id, user.id);

        // Generate token
        const authToken = generateToken(user);

        // Log audit
        await logAuditAction({
            userId: user.id,
            action: 'user_registered',
            entityType: 'user',
            entityId: user.id,
            details: { via: 'invitation' },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            token: authToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
        });
    }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                phone: req.user.phone,
                status: req.user.status,
                roles: req.user.roles,
                createdAt: req.user.created_at,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user info',
        });
    }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current and new passwords are required',
            });
        }

        // Verify current password
        const user = await verifyPassword(req.user.email, currentPassword);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect',
            });
        }

        // Update password
        await updatePassword(req.user.id, newPassword);

        // Log audit
        await logAuditAction({
            userId: req.user.id,
            action: 'password_changed',
            entityType: 'user',
            entityId: req.user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password',
        });
    }
});

/**
 * POST /api/auth/verify-invitation
 * Verify invitation token (without registering)
 */
router.post('/verify-invitation', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token is required',
            });
        }

        const invitation = await getInvitationByToken(token);
        if (!invitation) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired invitation token',
            });
        }

        res.json({
            success: true,
            email: invitation.email,
            expiresAt: invitation.expires_at,
        });
    } catch (error) {
        console.error('Verify invitation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify invitation',
        });
    }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required',
            });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            // Don't reveal user existence
            return res.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        }

        // Create reset token (reusing invitation logic)
        const { createPasswordResetToken, queueEmail } = require('../services/database');
        const invitation = await createPasswordResetToken(email, user.id, 1); // 1 day expiry

        const resetLink = `${process.env.APP_URL || 'http://localhost:4901'}/reset-password?token=${invitation.token}`;

        await queueEmail({
            toEmail: email,
            templateName: 'password_reset',
            subject: 'Reset your password - ATRIA 360',
            bodyHtml: `<p>Click here to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
            bodyText: `Click here to reset your password: ${resetLink}`,
            templateData: {
                name: user.name,
                resetLink,
            },
        });

        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process request',
        });
    }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                error: 'Token and password are required',
            });
        }

        const { verifyPasswordResetToken, markInvitationUsed, updatePassword } = require('../services/database');

        const invitation = await verifyPasswordResetToken(token);
        if (!invitation) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }

        // Update password
        const user = await getUserByEmail(invitation.email);
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'User not found',
            });
        }

        await updatePassword(user.id, password);
        await markInvitationUsed(invitation.id, user.id);

        res.json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset password',
        });
    }
});

const { generateOTP, verifyOTP } = require('../services/otpService');

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number
 */
router.post('/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, error: 'Phone number is required' });
        }
        await generateOTP(phone);
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ success: false, error: 'Failed to send OTP' });
    }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, code } = req.body;
        if (!phone || !code) {
            return res.status(400).json({ success: false, error: 'Phone and code are required' });
        }
        const result = await verifyOTP(phone, code);
        if (result.success) {
            res.json({ success: true, message: 'Phone verified successfully' });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify OTP' });
    }
});

/**
 * POST /api/auth/location
 * Store user login location
 */
router.post('/location', requireAuth, async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        const userId = req.user.id;

        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Location coordinates required' });
        }

        const { pool } = require('../services/database');
        await pool.query(
            `INSERT INTO login_locations (user_id, latitude, longitude, address, logged_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [userId, latitude, longitude, address || null]
        );

        res.json({ success: true, message: 'Location stored successfully' });
    } catch (error) {
        console.error('Store location error:', error);
        res.status(500).json({ success: false, error: 'Failed to store location' });
    }
});

/**
 * GET /api/auth/my-location
 * Get user's latest login location
 */
router.get('/my-location', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { pool } = require('../services/database');

        const result = await pool.query(
            `SELECT latitude, longitude, address, logged_at 
             FROM login_locations 
             WHERE user_id = $1 
             ORDER BY logged_at DESC 
             LIMIT 1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({ success: true, location: null });
        }

        res.json({
            success: true,
            location: {
                latitude: parseFloat(result.rows[0].latitude),
                longitude: parseFloat(result.rows[0].longitude),
                address: result.rows[0].address,
                logged_at: result.rows[0].logged_at
            }
        });
    } catch (error) {
        console.error('Get location error:', error);
        res.status(500).json({ success: false, error: 'Failed to get location' });
    }
});

module.exports = router;

