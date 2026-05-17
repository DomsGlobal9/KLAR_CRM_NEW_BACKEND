import express from 'express';
import { authenticate, requireRole } from '../middleware';
import { emailResponseController } from '../controllers/emailResponse.controller';

const router = express.Router();

/**
 * Get all email logs with optional filters
 */
router.get('/logs', authenticate, emailResponseController.getEmailLogs);

/**
 * Get all email replies with optional filters
 */
router.get('/replies', authenticate, emailResponseController.getEmailReplies);

/**
 * Get email conversation by tracking ID
 */
router.get('/conversation/:trackingId', authenticate, emailResponseController.getEmailConversation);

/**
 * Get emails by lead ID
 */
router.get('/lead/:leadId', authenticate, emailResponseController.getEmailsByLeadId);

/**
 * Get unread/recent replies
 */
router.get('/replies/unread', authenticate, emailResponseController.getRecentReplies);

export default router;