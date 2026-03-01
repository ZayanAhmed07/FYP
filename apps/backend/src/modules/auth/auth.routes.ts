import { Router } from 'express';

import { login, register, forgotPassword, resetPassword, googleAuth, googleAuthCallback } from './auth.controller';
import { logout } from './auth.logout.controller';
import { loginValidator, registerValidator, forgotPasswordValidator, resetPasswordValidator } from './auth.validation';
import passport from './passport';
import { authLimiter, passwordResetLimiter } from '../../middleware/rateLimiter';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

router.post('/login', authLimiter, loginValidator, login);
router.post('/register', authLimiter, registerValidator, register);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidator, resetPassword);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account' // Force account selection
}));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login` }), googleAuthCallback);

export default router;





