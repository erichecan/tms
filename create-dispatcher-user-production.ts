import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// 直接使用生产数据库 URL
const PRODUCTION_DB_URL = 'postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
    connectionString: PRODUCTION_DB_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createDispatcherUser() {
    const client = await pool.connect();

    try {
        const email = 'info@aponyinc.com';
        const password = 'apony27669';
        const name = 'Apony Dispatcher';
        const roleId = 'R-DISPATCHER';

        console.log('🔍 Connecting to PRODUCTION database...');
        console.log('📧 Creating user:', email);

        // Check if user already exists
        const existingUser = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            console.log(`❌ User with email ${email} already exists!`);
            console.log('Existing user:', existingUser.rows[0]);

            // Update the password
            console.log('\n🔄 Updating password for existing user...');
            const hashedPassword = await bcrypt.hash(password, 10);

            await client.query(
                'UPDATE users SET password = $1, roleid = $2, status = $3 WHERE email = $4',
                [hashedPassword, roleId, 'ACTIVE', email]
            );

            console.log('✅ Password updated successfully!');
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate user ID
        const userId = `U-${Date.now()}`;

        // Insert new user
        await client.query(
            `INSERT INTO users (id, name, email, password, roleid, status, lastlogin) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [userId, name, email, hashedPassword, roleId, 'ACTIVE']
        );

        console.log('✅ Dispatcher user created successfully in PRODUCTION database!');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('👤 Name:', name);
        console.log('🎭 Role:', roleId);
        console.log('🆔 User ID:', userId);

        // Verify the user was created
        const verifyUser = await client.query(
            'SELECT id, name, email, roleid, status FROM users WHERE email = $1',
            [email]
        );

        console.log('\n✅ Verification:');
        console.log(verifyUser.rows[0]);

    } catch (error) {
        console.error('❌ Error creating user:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

createDispatcherUser()
    .then(() => {
        console.log('\n✅ Script completed successfully!');
        console.log('🌐 You can now login at: https://tms-frontend-275911787144.us-central1.run.app');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
