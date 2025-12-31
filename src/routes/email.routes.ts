import { Router } from 'express';
import { emailController } from '../controllers/email.controller';

const router = Router();

/**
 * @route   GET /api/email/health
 * @desc    Health check for email service
 * @access  Public
 */
router.get('/health', emailController.healthCheck.bind(emailController));

/**
 * @route   GET /api/email/status
 * @desc    Get email service status
 * @access  Public
 */
router.get('/status', emailController.getServiceStatus.bind(emailController));

/**
 * @route   POST /api/email/send
 * @desc    Send a single email
 * @access  Public
 * @body    {SendEmailPayload}
 */
router.post('/send', emailController.sendEmail.bind(emailController));

/**
 * @route   POST /api/email/send-bulk
 * @desc    Send multiple emails
 * @access  Public
 * @body    {BulkEmailPayload}
 */
router.post('/send-bulk', emailController.sendBulkEmails.bind(emailController));

/**
 * @route   POST /api/email/send-test
 * @desc    Send a test email
 * @access  Public
 * @body    {to?: string}
 */
router.post('/send-test', emailController.sendTestEmail.bind(emailController));

/**
 * @route   POST /api/email/validate
 * @desc    Validate email addresses
 * @access  Public
 * @body    {emails: string | string[]}
 */
router.post('/validate', emailController.validateEmails.bind(emailController));

export default router;