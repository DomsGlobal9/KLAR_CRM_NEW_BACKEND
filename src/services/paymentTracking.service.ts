import { paymentTrackingRepository, PaymentSummary } from '../repositories/paymentTracking.repository';

export const paymentTrackingService = {
    /**
     * Get total payments received (all time)
     */
    async getTotalPaymentsReceived(): Promise<{ total: number }> {
        const total = await paymentTrackingRepository.getTotalPaymentsReceived();
        return { total };
    },

    /**
     * Get payments received in a specific date range
     */
    async getPaymentsInRange(startDate: string, endDate: string): Promise<{ total: number }> {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid date format');
        }

        const total = await paymentTrackingRepository.getPaymentsReceivedInRange(start, end);
        return { total };
    },

    /**
     * Get comprehensive payment summary for dashboard
     */
    async getPaymentSummary(timeRange?: 'week' | 'month' | 'year' | 'all'): Promise<PaymentSummary> {
        return await paymentTrackingRepository.getPaymentSummary(timeRange);
    },

    /**
     * Get cumulative payments for growth tracking
     */
    async getCumulativePayments(): Promise<Array<{ date: string; cumulative_amount: number }>> {
        return await paymentTrackingRepository.getCumulativePayments();
    },

    /**
     * Get payment analytics by method
     */
    async getPaymentMethodAnalytics(): Promise<{
        byMethod: Array<{ method: string; total_amount: number; count: number }>;
        mostUsedMethod: string;
        highestEarningMethod: string;
    }> {
        const byMethod = await paymentTrackingRepository.getPaymentsByMethod();

        const mostUsedMethod = byMethod.reduce((prev, current) =>
            (prev.count > current.count) ? prev : current
        ).method;

        const highestEarningMethod = byMethod.reduce((prev, current) =>
            (prev.total_amount > current.total_amount) ? prev : current
        ).method;

        return {
            byMethod,
            mostUsedMethod,
            highestEarningMethod
        };
    }
};