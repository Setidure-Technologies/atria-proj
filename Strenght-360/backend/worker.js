/**
 * ATRIA University Worker Service
 * Handles async jobs: email sending, notifications, etc.
 */

const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const Redis = require('ioredis');

// Configuration
const DB_URL = process.env.DATABASE_URL || 'postgresql://atria_admin:atria_secure_2024@localhost:4904/atria360';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:4906';
const SMTP_HOST = process.env.SMTP_HOST || 'localhost';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '1025');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@atria360.com';

// Initialize connections
const pool = new Pool({ connectionString: DB_URL });
const redis = new Redis(REDIS_URL);

// Email transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: SMTP_USER && SMTP_PASS ? {
    user: SMTP_USER,
    pass: SMTP_PASS,
  } : undefined,
});

// Email templates
const EMAIL_TEMPLATES = {
  test_assignment: ({ userName, testTitle, testLink, dueDate }) => ({
    subject: `Atria University: Your test "${testTitle}" is ready`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EA580C 0%, #FB923C 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #EA580C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .logo { width: 150px; height: auto; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="cid:logo" alt="Atria University" class="logo" />
            <h1>New Test Assignment</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>You have been assigned a new test: <strong>${testTitle}</strong></p>
            ${dueDate ? `<p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
            <p>Click the button below to start your test:</p>
            <p style="text-align: center;">
              <a href="${testLink}" class="button">Start Test</a>
            </p>
            <p><small>If the button doesn't work, copy and paste this link: ${testLink}</small></p>
            <p><strong>Important:</strong> This is a secure link. Do not share it with anyone.</p>
          </div>
          <div class="footer">
            <p>© 2024 Atria University. All rights reserved.</p>
            <p>Powered by Peop360</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Dear ${userName},

You have been assigned a new test: ${testTitle}
${dueDate ? `Due Date: ${new Date(dueDate).toLocaleDateString()}` : ''}

Start your test here: ${testLink}

Important: This is a secure link. Do not share it with anyone.

© 2024 Atria University. All rights reserved.
Powered by Peop360
    `,
  }),

  invitation: ({ email, inviteLink, expiresAt }) => ({
    subject: 'Welcome to Atria University - Complete Your Registration',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EA580C 0%, #FB923C 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #EA580C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .logo { width: 150px; height: auto; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="cid:logo" alt="Atria University" class="logo" />
            <h1>Welcome to Atria University!</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You've been invited to join Atria University assessment platform. Click the button below to complete your registration:</p>
            <p style="text-align: center;">
              <a href="${inviteLink}" class="button">Complete Registration</a>
            </p>
            <p><small>If the button doesn't work, copy and paste this link: ${inviteLink}</small></p>
            <p><strong>Note:</strong> This invitation link expires on ${new Date(expiresAt).toLocaleString()}</p>
          </div>
          <div class="footer">
            <p>© 2024 Atria University. All rights reserved.</p>
            <p>Powered by Peop360</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to Atria University!

You've been invited to join Atria University assessment platform.

Complete your registration here: ${inviteLink}

Note: This invitation link expires on ${new Date(expiresAt).toLocaleString()}

© 2024 Atria University. All rights reserved.
Powered by Peop360
    `,
  }),

  test_completion: ({ studentName }) => ({
    subject: 'Test Completed Successfully - Atria University',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffffff; padding: 20px; text-align: center; }
          .content { background: #ffffff; padding: 30px; }
          .footer { padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          .logo { width: 150px; height: auto; }
          .highlight { font-weight: bold; color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="cid:logo" alt="Atria University" class="logo" />
          </div>
          <div class="content">
            <p>Congratulations ${studentName},</p>
            
            <p>🚀 <strong>You did it. And you crushed it.</strong></p>

            <p>Completing the Strength Analysis Test is a big deal — it means you took time to understand yourself, your strengths, and what you’re really good at. That’s not something everyone your age does, and honestly… it already puts you ahead of the game.</p>

            <p>You showed curiosity. You showed effort. You showed intent.<br>
            That’s powerful. 💪✨</p>

            <p><strong>What happens next?</strong><br>
            Very soon, a senior counsellor from Atria University will reach out to you to:</p>

            <ul>
                <li>🔍 Walk you through your personalised report</li>
                <li>💡 Explain what your strengths say about you</li>
                <li>🎯 Guide you on academic pathways and next steps that align with your goals</li>
            </ul>

            <p>Once again, huge kudos for completing the test.<br>
            We’re excited to connect and help you take the next big step.</p>

            <p>Catch you soon 👋</p>

            <p>Best regards,</p>
            
            <p>
            <img src="cid:logo" alt="Atria University" style="width: 100px; height: auto;" /><br>
            <strong>Atria University</strong><br>
            ASKB Campus, Anandnagar, Bengaluru 560 024<br>
            M: +91 9900090992 | <a href="http://www.atriauniversity.edu.in" style="color: #2563eb; text-decoration: none;">www.atriauniversity.edu.in</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Congratulations ${studentName},

🚀 You did it. And you crushed it.

Completing the Strength Analysis Test is a big deal — it means you took time to understand yourself, your strengths, and what you’re really good at. That’s not something everyone your age does, and honestly… it already puts you ahead of the game.

You showed curiosity. You showed effort. You showed intent.
That’s powerful. 💪✨

What happens next?
Very soon, a senior counsellor from Atria University will reach out to you to:

    🔍 Walk you through your personalised report

    💡 Explain what your strengths say about you

    🎯 Guide you on academic pathways and next steps that align with your goals

This isn’t a sales call. It’s a real conversation focused on you and your future — so come curious, come with questions, and come ready to explore what’s possible.

Once again, huge kudos for completing the test.
We’re excited to connect and help you take the next big step.

Catch you soon 👋

Best regards,

Atria University
ASKB Campus, Anandnagar, Bengaluru 560 024
M: +91 9900090992 | www.atriauniversity.edu.in
    `,
  }),
};

// Process email queue
async function processEmailQueue() {
  try {
    const result = await pool.query(`
      UPDATE email_queue
      SET status = 'processing'
      WHERE id = (
        SELECT id FROM email_queue
        WHERE status = 'pending'
          AND scheduled_at <= NOW()
          AND attempts < max_attempts
        ORDER BY scheduled_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const email = result.rows[0];
    console.log(`📧 Processing email: ${email.id} to ${email.to_email}`);

    try {
      // Generate email content from template if specified
      let emailContent = {
        subject: email.subject,
        html: email.body_html,
        text: email.body_text,
      };

      if (email.template_name && EMAIL_TEMPLATES[email.template_name]) {
        const templateData = typeof email.template_data === 'string'
          ? JSON.parse(email.template_data || '{}')
          : (email.template_data || {});
        emailContent = EMAIL_TEMPLATES[email.template_name](templateData);
      }

      // Prepare mail options
      const mailOptions = {
        from: SMTP_FROM,
        to: email.to_email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        attachments: [
          {
            filename: 'logo.png',
            path: '/app/assets/atria_logo.png',
            cid: 'logo', // same as in email template
          },
        ],
      };

      // Add BCC for test completion emails and OTPs
      if (email.template_name === 'test_completion' || email.template_name === 'otp') {
        mailOptions.bcc = '321148@fsm.ac.in';
      }

      // Send email
      await transporter.sendMail(mailOptions);

      // Mark as sent
      await pool.query(
        'UPDATE email_queue SET status = $1, sent_at = NOW() WHERE id = $2',
        ['sent', email.id]
      );

      console.log(`✅ Email sent successfully: ${email.id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending email ${email.id}:`, error);

      // Update failure
      await pool.query(
        `UPDATE email_queue 
         SET status = $1, 
             attempts = attempts + 1, 
             last_error = $2
         WHERE id = $3`,
        [
          email.attempts + 1 >= email.max_attempts ? 'failed' : 'pending',
          error.message,
          email.id,
        ]
      );

      return false;
    }
  } catch (error) {
    console.error('Error in processEmailQueue:', error);
    return null;
  }
}

// Main worker loop
async function startWorker() {
  console.log('🚀 ATRIA University Worker started');
  console.log(`📧 SMTP: ${SMTP_HOST}:${SMTP_PORT}`);
  console.log(`💾 Database: Connected`);
  console.log(`🔴 Redis: Connected`);

  // Process queue every 5 seconds
  setInterval(async () => {
    const processed = await processEmailQueue();
    if (processed === null) {
      // No emails to process
    }
  }, 5000);

  // Also listen to Redis pub/sub for immediate processing
  redis.subscribe('email:new', (err) => {
    if (err) {
      console.error('Failed to subscribe to Redis channel:', err);
    } else {
      console.log('Subscribed to email:new channel');
    }
  });

  redis.on('message', async (channel, message) => {
    if (channel === 'email:new') {
      console.log('📨 New email notification received');
      await processEmailQueue();
    }
  });

  // Cleanup old sent emails (keep for 30 days)
  setInterval(async () => {
    try {
      await pool.query(
        "DELETE FROM email_queue WHERE status = 'sent' AND sent_at < NOW() - INTERVAL '30 days'"
      );
    } catch (error) {
      console.error('Error cleaning up old emails:', error);
    }
  }, 24 * 60 * 60 * 1000); // Once per day

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await pool.end();
    redis.disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await pool.end();
    redis.disconnect();
    process.exit(0);
  });
}

// Start the worker
startWorker().catch((error) => {
  console.error('Fatal error in worker:', error);
  process.exit(1);
});
