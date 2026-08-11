import { supabaseAdmin } from '../config';

export interface PaymentSummary {
    totalPaymentsReceived: number;
    totalInvoicesPaid: number;
    paymentsByPeriod: {
        daily: Array<{ date: string; amount: number }>;
        weekly: Array<{ week: string; amount: number }>;
        monthly: Array<{ month: string; amount: number }>;
    };
    recentPayments: Array<{
        id: string;
        invoice_number: string;
        client_name: string;
        amount: number;
        paid_date: string;
        payment_method: string;
    }>;
}

export const paymentTrackingRepository = {
    /**
     * Get total payments received (lifetime, current week, current month, current year, and pending balance)
     */
    async getTotalPaymentsReceived(): Promise<{ total: number; currentWeekTotal: number; currentMonthTotal: number; currentYearTotal: number; pendingAmount: number }> {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('paid_amount, paid_date, status, total, created_at')
            .not('paid_amount', 'is', null);

        if (error) {
            throw new Error(`Failed to get total payments: ${error.message}`);
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Calculate start of current week (Monday at 00:00:00)
        const startOfWeek = new Date(now);
        const dayOfWeek = startOfWeek.getDay();
        const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
        startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        let total = 0;
        let currentWeekTotal = 0;
        let currentMonthTotal = 0;
        let currentYearTotal = 0;
        let pendingAmount = 0;

        data?.forEach(invoice => {
            const paid = invoice.paid_amount || 0;
            const invoiceTotal = invoice.total || 0;

            if (invoice.status === 'paid' || invoice.status === 'partially_paid') {
                total += paid;

                // Check payment date breakdown
                const pDate = invoice.paid_date ? new Date(invoice.paid_date) : (invoice.created_at ? new Date(invoice.created_at) : null);
                if (pDate && !isNaN(pDate.getTime())) {
                    if (pDate.getFullYear() === currentYear) {
                        currentYearTotal += paid;

                        if (pDate.getMonth() === currentMonth) {
                            currentMonthTotal += paid;
                        }

                        if (pDate >= startOfWeek && pDate <= now) {
                            currentWeekTotal += paid;
                        }
                    }
                }
            }

            if (invoice.status === 'pending' || invoice.status === 'partially_paid' || invoice.status === 'overdue') {
                const remaining = invoiceTotal - paid;
                if (remaining > 0) {
                    pendingAmount += remaining;
                }
            }
        });

        return { total, currentWeekTotal, currentMonthTotal, currentYearTotal, pendingAmount };
    },

    /**
     * Get year-over-year monthly revenue comparisons for chart
     */
    async getYearOverYearMonthlyRevenue(): Promise<Array<{ name: string; current: number; previous: number }>> {
        const now = new Date();
        const currentYear = now.getFullYear();
        const previousYear = currentYear - 1;

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartData = monthNames.map(name => ({ name, current: 0, previous: 0 }));

        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('paid_amount, paid_date, created_at, status')
            .in('status', ['paid', 'partially_paid'])
            .not('paid_amount', 'is', null)
            .gt('paid_amount', 0);

        if (error) {
            console.error('Failed to fetch YoY monthly revenue:', error);
            return chartData;
        }

        data?.forEach(invoice => {
            const pDate = invoice.paid_date ? new Date(invoice.paid_date) : (invoice.created_at ? new Date(invoice.created_at) : null);
            if (pDate && !isNaN(pDate.getTime())) {
                const yr = pDate.getFullYear();
                const mIdx = pDate.getMonth();
                const amount = invoice.paid_amount || 0;

                if (yr === currentYear) {
                    chartData[mIdx].current += amount;
                } else if (yr === previousYear) {
                    chartData[mIdx].previous += amount;
                }
            }
        });

        return chartData;
    },

    /**
     * Get total payments received within a date range
     */
    async getPaymentsReceivedInRange(startDate: Date, endDate: Date): Promise<number> {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('paid_amount')
            .eq('status', 'paid')
            .not('paid_amount', 'is', null)
            .gte('paid_date', startDate.toISOString())
            .lte('paid_date', endDate.toISOString());

        if (error) {
            throw new Error(`Failed to get payments in range: ${error.message}`);
        }

        const total = data?.reduce((sum, invoice) => sum + (invoice.paid_amount || 0), 0) || 0;
        return total;
    },

    /**
     * Get detailed payment summary for dashboard
     */
    async getPaymentSummary(timeRange?: 'week' | 'month' | 'year' | 'all'): Promise<PaymentSummary> {
        // Get all paid invoices
        let query = supabaseAdmin
            .from('invoices')
            .select('id, invoice_number, client_name, paid_amount, paid_date, payment_method, status, total')
            .eq('status', 'paid')
            .not('paid_amount', 'is', null)
            .gt('paid_amount', 0)
            .order('paid_date', { ascending: false });

        // Apply time range filter
        if (timeRange && timeRange !== 'all') {
            const dateFilter = new Date();
            switch (timeRange) {
                case 'week':
                    dateFilter.setDate(dateFilter.getDate() - 7);
                    query = query.gte('paid_date', dateFilter.toISOString());
                    break;
                case 'month':
                    dateFilter.setMonth(dateFilter.getMonth() - 1);
                    query = query.gte('paid_date', dateFilter.toISOString());
                    break;
                case 'year':
                    dateFilter.setFullYear(dateFilter.getFullYear() - 1);
                    query = query.gte('paid_date', dateFilter.toISOString());
                    break;
            }
        }

        const { data: paidInvoices, error } = await query;

        if (error) {
            throw new Error(`Failed to get payment summary: ${error.message}`);
        }

        // Calculate total payments
        const totalPaymentsReceived = paidInvoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0;
        const totalInvoicesPaid = paidInvoices?.length || 0;

        // Get payments by day (last 30 days)
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const { data: dailyData } = await supabaseAdmin
            .from('invoices')
            .select('paid_amount, paid_date')
            .eq('status', 'paid')
            .gte('paid_date', last30Days.toISOString())
            .not('paid_amount', 'is', null);

        const dailyMap = new Map<string, number>();
        dailyData?.forEach(invoice => {
            if (invoice.paid_date) {
                const date = new Date(invoice.paid_date).toISOString().split('T')[0];
                dailyMap.set(date, (dailyMap.get(date) || 0) + (invoice.paid_amount || 0));
            }
        });

        const daily = Array.from(dailyMap.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Get payments by week (last 12 weeks)
        const weeklyMap = new Map<string, number>();
        dailyData?.forEach(invoice => {
            if (invoice.paid_date) {
                const date = new Date(invoice.paid_date);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];
                weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + (invoice.paid_amount || 0));
            }
        });

        const weekly = Array.from(weeklyMap.entries())
            .map(([week, amount]) => ({ week, amount }))
            .sort((a, b) => a.week.localeCompare(b.week))
            .slice(-12);

        // Get payments by month (last 12 months)
        const monthlyMap = new Map<string, number>();
        const { data: monthlyData } = await supabaseAdmin
            .from('invoices')
            .select('paid_amount, paid_date')
            .eq('status', 'paid')
            .not('paid_amount', 'is', null);

        monthlyData?.forEach(invoice => {
            if (invoice.paid_date) {
                const date = new Date(invoice.paid_date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + (invoice.paid_amount || 0));
            }
        });

        const monthly = Array.from(monthlyMap.entries())
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-12);

        // Get recent payments (last 10)
        const recentPayments = (paidInvoices || []).slice(0, 10).map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            client_name: inv.client_name,
            amount: inv.paid_amount || 0,
            paid_date: inv.paid_date,
            payment_method: inv.payment_method || 'N/A'
        }));

        return {
            totalPaymentsReceived,
            totalInvoicesPaid,
            paymentsByPeriod: {
                daily,
                weekly,
                monthly
            },
            recentPayments
        };
    },

    /**
     * Get cumulative payments over time (for growth chart)
     */
    async getCumulativePayments(): Promise<Array<{ date: string; cumulative_amount: number }>> {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('paid_amount, paid_date')
            .eq('status', 'paid')
            .not('paid_amount', 'is', null)
            .gt('paid_amount', 0)
            .order('paid_date', { ascending: true });

        if (error) {
            throw new Error(`Failed to get cumulative payments: ${error.message}`);
        }

        let cumulative = 0;
        const result: Array<{ date: string; cumulative_amount: number }> = [];
        const dailyMap = new Map<string, number>();

        // Group by date first
        data?.forEach(invoice => {
            if (invoice.paid_date) {
                const date = new Date(invoice.paid_date).toISOString().split('T')[0];
                dailyMap.set(date, (dailyMap.get(date) || 0) + (invoice.paid_amount || 0));
            }
        });

        // Calculate cumulative
        const sortedDates = Array.from(dailyMap.keys()).sort();
        for (const date of sortedDates) {
            cumulative += dailyMap.get(date) || 0;
            result.push({ date, cumulative_amount: cumulative });
        }

        return result;
    },

    /**
     * Get payments by payment method
     */
    async getPaymentsByMethod(): Promise<Array<{ method: string; total_amount: number; count: number }>> {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('payment_method, paid_amount')
            .eq('status', 'paid')
            .not('paid_amount', 'is', null)
            .gt('paid_amount', 0);

        if (error) {
            throw new Error(`Failed to get payments by method: ${error.message}`);
        }

        const methodMap = new Map<string, { total_amount: number; count: number }>();

        data?.forEach(invoice => {
            const method = invoice.payment_method || 'unknown';
            const current = methodMap.get(method) || { total_amount: 0, count: 0 };
            methodMap.set(method, {
                total_amount: current.total_amount + (invoice.paid_amount || 0),
                count: current.count + 1
            });
        });

        return Array.from(methodMap.entries()).map(([method, data]) => ({
            method,
            total_amount: data.total_amount,
            count: data.count
        }));
    }
};