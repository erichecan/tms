
const { pool } = require('./apps/backend/dist/db-postgres');
const bcrypt = require('bcrypt');

async function resetPassword() {
    try {
        const client = await pool.connect();
        const email = 'eriche@aponygroup.com';
        const newPassword = 'password123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log(`Resetting password for: ${email}`);

        const res = await client.query(`
            UPDATE users 
            SET password_hash = $1 
            WHERE email = $2
        `, [hashedPassword, email]);

        if (res.rowCount > 0) {
            console.log('Password reset successfully.');
        } else {
            console.log('User not found during password reset.');
        }
        client.release();
    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        process.exit();
    }
}

resetPassword();
