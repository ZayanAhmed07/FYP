import { Router } from 'express';

import { login, register, forgotPassword, resetPassword, googleAuth, googleAuthCallback } from './auth.controller';
import { loginValidator, registerValidator, forgotPasswordValidator, resetPasswordValidator } from './auth.validation';
import passport from './passport';

const router = Router();

router.post('/login', loginValidator, login);
router.post('/register', registerValidator, register);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/reset-password', resetPasswordValidator, resetPassword); // expect body { token, password }

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account' // Force account selection
}));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login` }), googleAuthCallback);

export default router;




