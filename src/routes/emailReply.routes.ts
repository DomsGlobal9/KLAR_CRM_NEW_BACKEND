import express from 'express';
import { authenticate } from '../middleware';
import { emailReplyController } from '../controllers/emailReply.controller';

const router = express.Router();

router.post('/reply/:trackingId', authenticate, emailReplyController.sendReply);

export default router;