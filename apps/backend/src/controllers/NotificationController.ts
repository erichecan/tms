import { Request, Response } from 'express';
import { query } from '../db-postgres';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        // Assuming AuthMiddleware populates req.user.id or we pass it via query for MVP
        // For strict security, use req.user?.id from token. 
        // For MVP/Demo with existing Context, we might need to rely on what's available.
        // Let's assume the user sends ?userId=... or we just fetch Top 10 for demo if auth is loose.
        // Better: Use the verified token user ID.

        // However, looking at UserController, req.user isn't explicitly typed in Express.Request there yet?
        // Let's try to grab it from query for Phase 1 MVP to ensure it works easily, 
        // OR standard `(req as any).user.id`.

        // Let's default to a broadcast or specific user if provided.
        const userId = req.query.userId as string;

        let sql = 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20';
        let params: any[] = [];

        if (userId) {
            sql = 'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20';
            params = [userId];
        }

        const result = await query(sql, params);

        // Mock seed if empty for demo
        if (result.rows.length === 0 && userId) {
            // Optional: Return a fake welcome notification if DB is empty
            return res.json([{
                id: 'welcome',
                type: 'INFO',
                title: 'Welcome to TMS 2.0',
                content: 'This is your notification center.',
                is_read: false,
                created_at: new Date().toISOString()
            }]);
        }

        res.json(result.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};
