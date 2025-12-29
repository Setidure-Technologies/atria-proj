const { queueEmail, pool } = require('./services/database');

async function verifyEmail() {
    try {
        console.log('🚀 Queueing test email...');
        const email = await queueEmail({
            toEmail: 'uncapped@atriauniversity.edu.in', // Sending to self for testing
            subject: 'Test Completed Successfully - Verification',
            templateName: 'test_completion',
            templateData: { studentName: 'Test Student' },
        });
        console.log(`✅ Email queued with ID: ${email.id}`);

        console.log('⏳ Waiting for worker to process...');

        // Poll for status update
        let attempts = 0;
        const maxAttempts = 10;

        const interval = setInterval(async () => {
            attempts++;
            const result = await pool.query('SELECT status, last_error FROM email_queue WHERE id = $1', [email.id]);
            const status = result.rows[0].status;
            const error = result.rows[0].last_error;

            console.log(`   Attempt ${attempts}: Status = ${status}`);

            if (status === 'sent') {
                console.log('✅ Email sent successfully!');
                clearInterval(interval);
                pool.end();
                process.exit(0);
            } else if (status === 'failed') {
                console.error('❌ Email failed to send:', error);
                clearInterval(interval);
                pool.end();
                process.exit(1);
            } else if (attempts >= maxAttempts) {
                console.error('❌ Timeout waiting for email to send');
                clearInterval(interval);
                pool.end();
                process.exit(1);
            }
        }, 2000);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

verifyEmail();
