const { queueEmail, pool } = require('./services/database');

async function sendTestEmail() {
    try {
        const targetEmail = '321148@fsm.ac.in';
        console.log(`🚀 Queueing test email to ${targetEmail}...`);

        const email = await queueEmail({
            toEmail: targetEmail,
            subject: 'Test Completed Successfully - Format Check',
            templateName: 'test_completion',
            templateData: { studentName: 'Test Student' },
        });
        console.log(`✅ Email queued with ID: ${email.id}`);

        // Wait a bit to allow processing
        setTimeout(() => {
            pool.end();
            process.exit(0);
        }, 2000);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

sendTestEmail();
