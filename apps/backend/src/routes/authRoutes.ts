import * as express from 'express';
import { login, register, changePassword, getCurrentUser } from '../controllers/AuthController';
import { verifyToken, requireRole } from '../middleware/AuthMiddleware';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.post('/register', verifyToken, requireRole(['ADMIN', 'R-ADMIN']), register); // Only admin can register new users
router.post('/change-password', verifyToken, changePassword);
router.get('/me', verifyToken, getCurrentUser);

export default router;
