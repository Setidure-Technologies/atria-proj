const { Pool } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://atria_admin:atria_secure_2024@localhost:4904/atria360';

const pool = new Pool({
    connectionString: DATABASE_URL,
});

async function restorePublicToken() {
    const token = 'atria-public-signup-2024';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const email = 'public-signup';

    // Set expiry to far future (e.g., 2030)
    const expiresAt = new Date('2030-01-01');

    try {
        const client = await pool.connect();
        try {
            // Check if exists
            const checkRes = await client.query(
                'SELECT * FROM invitations WHERE token_hash = $1',
                [tokenHash]
            );

            if (checkRes.rows.length > 0) {
                console.log('Token already exists. Updating expiry...');
                await client.query(
                    'UPDATE invitations SET expires_at = $1, used_at = NULL WHERE token_hash = $2',
                    [expiresAt, tokenHash]
                );
                console.log('✅ Token updated.');
            } else {
                console.log('Token not found. Creating...');
                await client.query(
                    `INSERT INTO invitations (email, token_hash, expires_at, created_by)
                     VALUES ($1, $2, $3, $4)`,
                    [email, tokenHash, expiresAt, 1] // Assuming admin ID 1 exists, or use NULL/system
                );
                console.log('✅ Token created.');
            }
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

restorePublicToken();
