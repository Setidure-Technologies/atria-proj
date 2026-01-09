const { Pool } = require('pg');

// Configuration
const DB_URL = process.env.DATABASE_URL || 'postgresql://atria_admin:atria_secure_2024@localhost:4904/atria360';

// Initialize connection
const pool = new Pool({ connectionString: DB_URL });

async function sendSampleEmail() {
    try {
        const targetEmail = '321148@fsm.ac.in';
        console.log(`Queueing sample test completion email for ${targetEmail}...`);

        const result = await pool.query(
            `INSERT INTO email_queue 
       (to_email, subject, template_name, template_data, status, scheduled_at, attempts, max_attempts)
       VALUES ($1, $2, $3, $4, $5, NOW(), 0, 3)
       RETURNING id`,
            [
                targetEmail,
                'Sample Test Completion Email',
                'test_completion',
                JSON.stringify({ studentName: 'Admin User' }),
                'pending'
            ]
        );

        console.log(`✅ Email queued successfully with ID: ${result.rows[0].id}`);
        console.log('The worker should pick this up shortly and send it (with BCC to the same address).');
    } catch (error) {
        console.error('❌ Error queueing email:', error);
    } finally {
        await pool.end();
    }
}

sendSampleEmail();
