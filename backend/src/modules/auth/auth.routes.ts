import { Router } from 'express';

import { login, register, forgotPassword, resetPassword } from './auth.controller';
import { loginValidator, registerValidator, forgotPasswordValidator, resetPasswordValidator } from './auth.validation';

const router = Router();

router.post('/login', loginValidator, login);
router.post('/register', registerValidator, register);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/reset-password', resetPasswordValidator, resetPassword); // expect body { token, password }

export default router;




