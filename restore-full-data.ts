
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        console.log('Restoring legacy users...');

        const passwordHash = await bcrypt.hash('password', 10);
        const demoUsers = [
            { id: 'U-DEMO-01', name: 'System Admin', email: 'admin@demo.tms-platform.com', role: 'R-ADMIN' },
            { id: 'U-DEMO-02', name: 'Test User', email: 'user@demo.tms-platform.com', role: 'R-DISPATCHER' },
            { id: 'U-DEMO-03', name: 'Demo Driver', email: 'driver@demo.tms-platform.com', role: 'R-DRIVER' }
        ];

        for (const u of demoUsers) {
            await client.query(`
                INSERT INTO users (id, name, email, roleId, password_hash, status, username)
                VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $3)
                ON CONFLICT (email) DO NOTHING
            `, [u.id, u.name, u.email, u.role, passwordHash]);
            console.log(`Restored user: ${u.email}`);
        }

        console.log('Restoring legacy drivers and accounts...');
        // Drivers from legacy seed.ts
        const drivers = [
            { name: '王司机', phone: '13800138001' },
            { name: '张司机', phone: '13900139001' },
            { name: '李司机', phone: '13700137001' },
            { name: '刘司机', phone: '13600136001' },
            { name: '陈司机', phone: '13500135001' },
            { name: '赵司机', phone: '13400134001' },
            { name: '孙司机', phone: '13300133001' },
            { name: '周司机', phone: '13200132001' },
            { name: '吴司机', phone: '13100131001' },
            { name: '郑司机', phone: '13000130001' }
        ];

        let idCounter = 100;
        for (const d of drivers) {
            const driverId = `D-${idCounter++}`;
            const email = `driver${idCounter}@tms.com`; // e.g. driver101@tms.com
            const userId = `U-${idCounter}`;

            // 1. Insert into Drivers table
            await client.query(`
                INSERT INTO drivers (id, name, phone, status, avatar_url)
                VALUES ($1, $2, $3, 'IDLE', 'https://i.pravatar.cc/150')
                ON CONFLICT (id) DO NOTHING
            `, [driverId, d.name, d.phone]);

            // 2. Create User Account
            await client.query(`
                INSERT INTO users (id, name, email, roleId, password_hash, status, username)
                VALUES ($1, $2, $3, 'R-DRIVER', $4, 'ACTIVE', $3)
                ON CONFLICT (email) DO NOTHING
            `, [userId, d.name, email, passwordHash]);

            console.log(`Restored driver ${d.name} -> User: ${email}`);
        }

        console.log('Restoration Complete.');

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
        process.exit(0);
    }
};

run();
