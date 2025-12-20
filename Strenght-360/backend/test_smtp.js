const nodemailer = require('nodemailer');

// Use env vars or fallback to the provided credentials for testing
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'as97612@gmail.com',
        pass: 'iudppzdvhfqkakmf',
    },
    tls: {
        rejectUnauthorized: false // Sometimes needed for self-signed certs or specific network configs
    }
});

async function main() {
    try {
        console.log('Testing SMTP Connection...');
        console.log('Host:', transporter.options.host);
        console.log('Port:', transporter.options.port);
        console.log('User:', transporter.options.auth.user);

        // Verify connection configuration
        await transporter.verify();
        console.log('✅ Server is ready to take our messages');

        const info = await transporter.sendMail({
            from: transporter.options.auth.user,
            to: transporter.options.auth.user, // Send to self
            subject: 'ATRIA 360 SMTP Test',
            text: 'If you receive this, the SMTP connection is working correctly.',
        });

        console.log('✅ Message sent: %s', info.messageId);
    } catch (error) {
        console.error('❌ Error occurred:', error);
        process.exit(1);
    }
}

main();
