/**
 * OTP Service - Email-based verification
 * Sends OTP codes via email using the existing email queue system
 */

const { pool, queueEmail } = require('./database');
const crypto = require('crypto');

// Rate limiting constants
const MAX_OTP_REQUESTS = 3;      // Max 3 OTP requests per window
const RATE_WINDOW_MINUTES = 15;  // 15 minute window
const MAX_VERIFY_ATTEMPTS = 5;   // Max 5 verification attempts per OTP
const OTP_EXPIRY_MINUTES = 10;   // OTP valid for 10 minutes

/**
 * Send OTP via email queue
 */
const sendOTPEmail = async (email, otp) => {
    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">ATRIA 360 Verification Code</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
        </div>
        <p style="color: #6b7280;">This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #6b7280;">If you didn't request this code, please ignore this email.</p>
    </div>
    `;

    await queueEmail({
        toEmail: email,
        subject: 'Your ATRIA 360 Verification Code',
        bodyHtml: htmlBody,
        bodyText: `Your ATRIA 360 verification code is: ${otp}. This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
        templateName: 'otp',
        templateData: { otp, expiresInMinutes: OTP_EXPIRY_MINUTES },
    });

    console.log(`📧 [OTP EMAIL] Queued OTP for: ${email}`);

    // In development, also log the OTP for easy testing
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🔐 [DEV MODE] OTP for ${email}: ${otp}`);
    }
};

/**
 * Generate and send OTP to email
 */
const generateOTP = async (email) => {
    // Check rate limiting
    const userResult = await pool.query(
        `SELECT otp_attempts, otp_last_sent_at FROM users WHERE email = $1`,
        [email]
    );

    if (userResult.rows.length === 0) {
        throw new Error('User not found');
    }

    const user = userResult.rows[0];
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_WINDOW_MINUTES * 60 * 1000);

    // Check if we're within rate limit window
    if (user.otp_last_sent_at && new Date(user.otp_last_sent_at) > windowStart) {
        if (user.otp_attempts >= MAX_OTP_REQUESTS) {
            const waitMinutes = Math.ceil((new Date(user.otp_last_sent_at).getTime() + RATE_WINDOW_MINUTES * 60 * 1000 - now.getTime()) / 60000);
            throw new Error(`Too many OTP requests. Please wait ${waitMinutes} minutes.`);
        }
    } else {
        // Reset counter if outside window
        await pool.query(
            `UPDATE users SET otp_attempts = 0 WHERE email = $1`,
            [email]
        );
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set expiry
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save OTP to DB and increment attempt counter
    await pool.query(
        `UPDATE users 
         SET otp_secret = $1, 
             otp_expires_at = $2, 
             otp_attempts = COALESCE(otp_attempts, 0) + 1,
             otp_last_sent_at = NOW()
         WHERE email = $3`,
        [otp, expiresAt, email]
    );

    // Send OTP via email
    await sendOTPEmail(email, otp);

    return { success: true, message: 'OTP sent to your email' };
};

/**
 * Verify OTP code
 */
const verifyOTP = async (email, code) => {
    const result = await pool.query(
        `SELECT id, otp_secret, otp_expires_at, otp_attempts 
         FROM users 
         WHERE email = $1`,
        [email]
    );

    if (result.rows.length === 0) {
        return { success: false, error: 'User not found' };
    }

    const user = result.rows[0];

    if (!user.otp_secret) {
        return { success: false, error: 'No OTP requested. Please request a new code.' };
    }

    if (new Date() > new Date(user.otp_expires_at)) {
        // Clear expired OTP
        await pool.query(
            `UPDATE users SET otp_secret = NULL, otp_expires_at = NULL WHERE email = $1`,
            [email]
        );
        return { success: false, error: 'OTP expired. Please request a new code.' };
    }

    if (user.otp_secret !== code) {
        return { success: false, error: 'Invalid OTP code' };
    }

    // Mark as verified and clear OTP
    await pool.query(
        `UPDATE users 
         SET email_verified = TRUE, 
             otp_secret = NULL, 
             otp_expires_at = NULL,
             otp_attempts = 0
         WHERE email = $1`,
        [email]
    );

    console.log(`✅ Email verified for: ${email}`);
    return { success: true, userId: user.id };
};

/**
 * Check if user's email is verified
 */
const isEmailVerified = async (email) => {
    const result = await pool.query(
        `SELECT email_verified FROM users WHERE email = $1`,
        [email]
    );
    return result.rows[0]?.email_verified === true;
};

module.exports = {
    generateOTP,
    verifyOTP,
    isEmailVerified,
    sendOTPEmail,
};
