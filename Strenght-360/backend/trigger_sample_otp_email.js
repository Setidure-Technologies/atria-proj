const { Pool } = require('pg');

// Configuration
const DB_URL = process.env.DATABASE_URL || 'postgresql://atria_admin:atria_secure_2024@localhost:4904/atria360';

// Initialize connection
const pool = new Pool({ connectionString: DB_URL });

async function sendSampleOTPEmail() {
    try {
        const targetEmail = '321148@fsm.ac.in';
        console.log(`Queueing sample OTP email for ${targetEmail}...`);

        // Mimic the body constructed in otpService.js
        const otp = '123456';
        const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Atria University Verification Code</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
        </div>
        <p style="color: #6b7280;">This code will expire in 10 minutes.</p>
        <p style="color: #6b7280;">If you didn't request this code, please ignore this email.</p>
    </div>
    `;

        const result = await pool.query(
            `INSERT INTO email_queue 
       (to_email, subject, template_name, body_html, body_text, status, scheduled_at, attempts, max_attempts)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0, 3)
       RETURNING id`,
            [
                targetEmail,
                'Your Atria University Verification Code',
                'otp',
                htmlBody,
                `Your Atria University verification code is: ${otp}`,
                'pending'
            ]
        );

        console.log(`✅ OTP Email queued successfully with ID: ${result.rows[0].id}`);
        console.log('The worker should pick this up shortly and send it (with BCC to the same address).');
    } catch (error) {
        console.error('❌ Error queueing email:', error);
    } finally {
        await pool.end();
    }
}

sendSampleOTPEmail();
