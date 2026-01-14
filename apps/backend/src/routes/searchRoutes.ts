import * as express from 'express';
import { globalSearch } from '../controllers/SearchController';

const router = express.Router();

router.get('/global', globalSearch);

export default router;
