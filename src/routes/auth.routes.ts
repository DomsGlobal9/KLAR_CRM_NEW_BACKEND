import express from 'express';
import { authController } from '../controllers';
import { authenticate } from '../middleware';

const router = express.Router();

/**
 * Public routes (no auth required)
 */

// === OTP-based Registration (Superadmin only) ===
router.post('/send-registration-otp', authController.sendRegistrationOTP);
router.post('/resend-registration-otp', authController.resendRegistrationOTP);
router.post('/verify-registration-otp', authController.verifyAndRegister);

// === OTP-based Login ===
router.post('/send-login-otp', authController.sendLoginOTP);
router.post('/resend-login-otp', authController.resendLoginOTP);
router.post('/verify-login-otp', authController.verifyLoginOTP);

// === Fallback password login (optional later) ===
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);

    // Forgot Password Routes
router.post('/api/auth/forgot-password', authController.forgotPassword);
router.post('/api/auth/resend-password-otp', authController.resendPasswordResetOTP);
router.post('/api/auth/verify-password-otp', authController.verifyPasswordResetOTP);
router.post('/api/auth/reset-password', authController.resetPassword);

export default router;