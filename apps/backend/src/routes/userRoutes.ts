import * as express from 'express';
import {
    getUsers, createUser, updateUser, deleteUser,
    getRoles, createRole, updateRole, getPermissions
} from '../controllers/UserController';

const router = express.Router();

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.get('/permissions', getPermissions);

export default router;
