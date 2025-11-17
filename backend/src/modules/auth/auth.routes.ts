import { Router } from 'express';

import { login, register } from './auth.controller';
import { loginValidator, registerValidator } from './auth.validation';

const router = Router();

router.post('/login', loginValidator, login);
router.post('/register', registerValidator, register);

export default router;



