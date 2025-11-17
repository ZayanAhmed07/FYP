import { Router } from 'express';

import { authenticate } from '../../middleware/authMiddleware';
import { getProfile, getUsers, updateProfile } from './user.controller';

const router = Router();

router.get('/me', authenticate, getProfile);
router.patch('/me', authenticate, updateProfile);
router.get('/', authenticate, getUsers);

export default router;


