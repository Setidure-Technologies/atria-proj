const { verifyPassword, getUserByEmail } = require('./services/database');
const bcrypt = require('bcryptjs');

async function testLogin() {
    try {
        const email = 'candidate1@example.com';
        const password = 'password123';

        console.log(`Testing login for ${email} with password ${password}`);

        const user = await getUserByEmail(email);
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }
        console.log('User found:', user.email, user.id);
        console.log('Stored hash:', user.password_hash);

        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('Bcrypt compare result:', isValid);

        const verifiedUser = await verifyPassword(email, password);
        if (verifiedUser) {
            console.log('✅ Login successful via verifyPassword');
        } else {
            console.log('❌ Login failed via verifyPassword');
        }

        process.exit(0);
    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

testLogin();
