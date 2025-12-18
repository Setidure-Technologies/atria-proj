const { pool } = require('./database');
const crypto = require('crypto');

// Mock SMS sender for now (logs to console)
const sendSMS = async (phone, message) => {
    console.log(`📱 [SMS MOCK] To: ${phone} | Message: ${message}`);
    return true;
};

const generateOTP = async (phone) => {
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Set expiry (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save to DB
    // We store the plain OTP for now for simplicity, but in production should be hashed
    // Since this is a temporary code, plain storage with short expiry is acceptable for MVP
    await pool.query(
        `UPDATE users 
         SET otp_secret = $1, otp_expires_at = $2, mobile_verified = FALSE
         WHERE phone = $3`,
        [otp, expiresAt, phone]
    );

    // Send SMS
    await sendSMS(phone, `Your ATRIA 360 verification code is: ${otp}`);

    return otp;
};

const verifyOTP = async (phone, code) => {
    const result = await pool.query(
        `SELECT otp_secret, otp_expires_at 
         FROM users 
         WHERE phone = $1`,
        [phone]
    );

    if (result.rows.length === 0) {
        return { success: false, error: 'User not found' };
    }

    const user = result.rows[0];

    if (!user.otp_secret) {
        return { success: false, error: 'No OTP requested' };
    }

    if (new Date() > new Date(user.otp_expires_at)) {
        return { success: false, error: 'OTP expired' };
    }

    if (user.otp_secret !== code) {
        return { success: false, error: 'Invalid OTP' };
    }

    // Mark as verified
    await pool.query(
        `UPDATE users 
         SET mobile_verified = TRUE, otp_secret = NULL, otp_expires_at = NULL
         WHERE phone = $1`,
        [phone]
    );

    return { success: true };
};

module.exports = {
    generateOTP,
    verifyOTP
};
