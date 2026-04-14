import { Request, Response } from 'express';
import { paymentTrackingService } from '../services/paymentTracking.service';
import { AuthRequest } from '../middleware';

export class PaymentTrackingController {
    /**
     * Get total payments received (all time)
     */
    getTotalPaymentsReceived = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            
            if (req.user?.role !== 'superadmin' && req.user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Only administrators can view payment totals.'
                });
            }

            const result = await paymentTrackingService.getTotalPaymentsReceived();

            return res.status(200).json({
                success: true,
                data: result,
                message: 'Total payments retrieved successfully'
            });
        } catch (error: any) {
            console.error('Error getting total payments:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get total payments'
            });
        }
    };

    /**
     * Get payments in date range
     */
    getPaymentsInRange = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            if (req.user?.role !== 'superadmin' && req.user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Only administrators can view payment data.'
                });
            }

            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'startDate and endDate are required'
                });
            }

            const result = await paymentTrackingService.getPaymentsInRange(
                startDate as string,
                endDate as string
            );

            return res.status(200).json({
                success: true,
                data: result,
                period: { startDate, endDate },
                message: 'Payments retrieved successfully'
            });
        } catch (error: any) {
            console.error('Error getting payments in range:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get payments'
            });
        }
    };

    /**
     * Get comprehensive dashboard payment summary
     */
    getPaymentSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            if (req.user?.role !== 'superadmin' && req.user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Only administrators can view payment summary.'
                });
            }

            const { timeRange } = req.query;
            const validRanges = ['week', 'month', 'year', 'all'];
            const range = (timeRange as 'week' | 'month' | 'year' | 'all') || 'all';

            if (!validRanges.includes(range)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid timeRange. Use: week, month, year, or all'
                });
            }

            const summary = await paymentTrackingService.getPaymentSummary(range);

            return res.status(200).json({
                success: true,
                data: summary,
                timeRange: range,
                message: 'Payment summary retrieved successfully'
            });
        } catch (error: any) {
            console.error('Error getting payment summary:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get payment summary'
            });
        }
    };

    /**
     * Get cumulative payments for growth chart
     */
    getCumulativePayments = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            if (req.user?.role !== 'superadmin' && req.user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Only administrators can view cumulative payments.'
                });
            }

            const cumulativeData = await paymentTrackingService.getCumulativePayments();

            return res.status(200).json({
                success: true,
                data: cumulativeData,
                message: 'Cumulative payments retrieved successfully'
            });
        } catch (error: any) {
            console.error('Error getting cumulative payments:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get cumulative payments'
            });
        }
    };

    /**
     * Get payment method analytics
     */
    getPaymentAnalytics = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            if (req.user?.role !== 'superadmin' && req.user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Only administrators can view payment analytics.'
                });
            }

            const analytics = await paymentTrackingService.getPaymentMethodAnalytics();

            // Add additional insights
            const totalRevenue = analytics.byMethod.reduce((sum, m) => sum + m.total_amount, 0);
            const averagePayment = analytics.byMethod.reduce((sum, m) => sum + m.total_amount, 0) /
                analytics.byMethod.reduce((sum, m) => sum + m.count, 0);

            return res.status(200).json({
                success: true,
                data: {
                    ...analytics,
                    total_revenue: totalRevenue,
                    average_payment_per_transaction: averagePayment,
                    total_transactions: analytics.byMethod.reduce((sum, m) => sum + m.count, 0)
                },
                message: 'Payment analytics retrieved successfully'
            });
        } catch (error: any) {
            console.error('Error getting payment analytics:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get payment analytics'
            });
        }
    };

    /**
     * Get dashboard overview with key metrics
     */
    getDashboardOverview = async (req: AuthRequest, res: Response): Promise<Response> => {
        try {
            if (req.user?.role !== 'superadmin' && req.user?.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Only administrators can view dashboard overview.'
                });
            }

            // Get all metrics in parallel
            const [totalPayments, summary, cumulativeData, analytics] = await Promise.all([
                paymentTrackingService.getTotalPaymentsReceived(),
                paymentTrackingService.getPaymentSummary('all'),
                paymentTrackingService.getCumulativePayments(),
                paymentTrackingService.getPaymentMethodAnalytics()
            ]);

            // Calculate growth metrics (compare last 30 days with previous 30 days)
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            const sixtyDaysAgo = new Date(now);
            sixtyDaysAgo.setDate(now.getDate() - 60);

            const [last30Days, previous30Days] = await Promise.all([
                paymentTrackingService.getPaymentsInRange(
                    thirtyDaysAgo.toISOString(),
                    now.toISOString()
                ),
                paymentTrackingService.getPaymentsInRange(
                    sixtyDaysAgo.toISOString(),
                    thirtyDaysAgo.toISOString()
                )
            ]);

            const growthRate = previous30Days.total === 0
                ? 100
                : ((last30Days.total - previous30Days.total) / previous30Days.total) * 100;

            return res.status(200).json({
                success: true,
                data: {
                    overview: {
                        total_revenue: totalPayments.total,
                        total_paid_invoices: summary.totalInvoicesPaid,
                        average_invoice_value: summary.totalInvoicesPaid > 0
                            ? totalPayments.total / summary.totalInvoicesPaid
                            : 0,
                        growth_rate: growthRate,
                        revenue_last_30_days: last30Days.total,
                        revenue_previous_30_days: previous30Days.total
                    },
                    recent_payments: summary.recentPayments,
                    payment_trends: {
                        daily: summary.paymentsByPeriod.daily.slice(-7), // Last 7 days
                        weekly: summary.paymentsByPeriod.weekly,
                        monthly: summary.paymentsByPeriod.monthly
                    },
                    cumulative_growth: cumulativeData,
                    payment_methods: analytics
                },
                message: 'Dashboard overview retrieved successfully'
            });
        } catch (error: any) {
            console.error('Error getting dashboard overview:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get dashboard overview'
            });
        }
    };
}

export const paymentTrackingController = new PaymentTrackingController();