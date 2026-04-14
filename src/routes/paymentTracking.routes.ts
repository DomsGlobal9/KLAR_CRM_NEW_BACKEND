import { Router } from 'express';
import { paymentTrackingController } from '../controllers/paymentTracking.controller';
import { authenticate, requireRole } from '../middleware';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * Get total payments received (all time)
 */
router.get('/total', paymentTrackingController.getTotalPaymentsReceived);

/**
 * Get payments in date range
 */
router.get('/range', paymentTrackingController.getPaymentsInRange);

/**
 * Get comprehensive payment summary
 */
router.get('/summary', paymentTrackingController.getPaymentSummary);

/**
 * Get cumulative payments for growth chart
 */
router.get('/cumulative', paymentTrackingController.getCumulativePayments);

/**
 * Get payment method analytics
 */
router.get('/analytics', paymentTrackingController.getPaymentAnalytics);

/**
 * Get complete dashboard overview (combines all metrics)
 */
router.get('/dashboard/overview', paymentTrackingController.getDashboardOverview);

export default router;