import express from 'express';
import { authController } from '../controllers';
import { authenticate } from '../middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = express.Router();

/**
 * Public routes (no auth required)
 *
 * Credential and OTP endpoints carry authLimiter, which is keyed by the email
 * being targeted and only counts FAILED attempts. That blunts credential
 * stuffing and OTP brute-forcing without penalising a user who signs in
 * repeatedly, and without letting one shared office IP exhaust everyone's
 * budget. Endpoints that do not take an email fall back to a per-IP key.
 */

// === OTP-based Registration (Superadmin only) ===
router.post('/send-registration-otp', authLimiter, authController.sendRegistrationOTP);
router.post('/resend-registration-otp', authLimiter, authController.resendRegistrationOTP);
router.post('/verify-registration-otp', authLimiter, authController.verifyAndRegister);

// === OTP-based Login ===
router.post('/send-login-otp', authLimiter, authController.sendLoginOTP);
router.post('/resend-login-otp', authLimiter, authController.resendLoginOTP);
router.post('/verify-login-otp', authLimiter, authController.verifyLoginOTP);

// === Fallback password login (optional later) ===
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authenticate, authController.logout);

// Deliberately NOT rate limited beyond the global API limiter: the frontend
// refreshes tokens on a timer, and throttling this would sign users out.
router.post('/refresh-token', authController.refreshToken);

    // Forgot Password Routes
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/resend-password-otp', authLimiter, authController.resendPasswordResetOTP);
router.post('/verify-password-otp', authLimiter, authController.verifyPasswordResetOTP);
router.post('/reset-password', authLimiter, authController.resetPassword);

export default router;
