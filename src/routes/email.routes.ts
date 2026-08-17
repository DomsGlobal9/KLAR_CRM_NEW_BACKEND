import { Router } from 'express';
import { emailController } from '../controllers/email.controller';
import { emailResponseController } from '../controllers/emailResponse.controller';
import { authenticate } from '../middleware';

const router = Router();

/**
 * @route   GET /api/email/all
 * @desc    Get all emails from Supabase database
 * @access  Private
 */
router.get('/all', authenticate, emailResponseController.getAllEmails);
router.get('/email/all', authenticate, emailResponseController.getAllEmails);

/**
 * @route   GET /api/email/health
 * @desc    Health check for email service
 * @access  Public
 */
router.get('/email/health', emailController.healthCheck.bind(emailController));

/**
 * @route   GET /api/email/status
 * @desc    Get email service status
 * @access  Public
 */
router.get('/email/status', emailController.getServiceStatus.bind(emailController));

/**
 * @route   POST /api/email/send
 * @desc    Send a single email
 * @access  Public
 * @body    {SendEmailPayload}
 */
router.post('/email/send', emailController.sendEmail.bind(emailController));

/**
 * @route   POST /api/email/send-bulk
 * @desc    Send multiple emails
 * @access  Public
 * @body    {BulkEmailPayload}
 */
router.post('/email/send-bulk', emailController.sendBulkEmails.bind(emailController));

/**
 * @route   POST /api/email/send-test
 * @desc    Send a test email
 * @access  Public
 * @body    {to?: string}
 */
router.post('/email/send-test', emailController.sendTestEmail.bind(emailController));

/**
 * @route   POST /api/email/validate
 * @desc    Validate email addresses
 * @access  Public
 * @body    {emails: string | string[]}
 */
router.post('/email/validate', emailController.validateEmails.bind(emailController));

/**
 * @route   GET /api/email/:id
 * @desc    Get email by ID
 * @access  Private
 */
router.get('/:id', authenticate, emailResponseController.getEmailById);

export default router;