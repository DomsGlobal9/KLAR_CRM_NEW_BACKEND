import invoiceNotificationService from '../services/invoiceNotification.service';
import getWhatsAppService from '../services/whatsapp.service';
import { envConfig } from './index';


/**
 * Cron job metadata
 */
export interface CronJobConfig {
    name: string;
    schedule: string;
    task: () => void;
    enabled: boolean;
    description: string;
}

export const cronSchedules = {

    /**
     * Runs every day at midnight
     */
    dailyMidnight: '0 0 * * *',

    /**
     * Runs every hour
     */
    hourly: '0 * * * *',

    /**
     * Runs every minute (for testing)
     */
    everyMinute: '* * * * *',

    /**
     * Runs every 30 seconds.
     *
     * Kept for local testing only. Never point a job that contacts customers at
     * this — see the warning on cronJobConfigs below.
     */
    every30Seconds: '*/30 * * * * *',

    /**
     * Runs every day at 09:00
     */
    dailyNineAM: '0 9 * * *',

    /**
     * Runs every day at 10:00
     */
    dailyTenAM: '0 10 * * *',

    /**
     * Runs every Monday at 1 AM
     */
    weeklyMonday: '0 1 * * 1',

    /**
     * Runs on the 1st of every month at 2 AM
     */
    monthlyFirstDay: '0 2 1 * *',

    /**
     * Runs on every 6 hours
     */
    every6Hours: '0 */6 * * *',

};

/**
 * Define cron job tasks
 */
export const cronJobs = {
    /**
    * Display message every 30 seconds
    */
    displayThirtySecondMessage: () => {

    },

    /**
     * Example: Clean up old data
     */
    cleanupOldData: () => {

        /**
         * Add your cleanup logic here
         */
    },

    /**
     * Example: Send daily reports
     */
    sendDailyReports: () => {

        /**
         * Add your report sending logic here
         */
    },

    /**
     * Example: Sync external data
     */
    syncExternalData: () => {

        /**
         * Add your sync logic here
         */
    },

    /**
     * Example: Database backup
     */
    backupDatabase: () => {

        /**
         * Add your backup logic here
         */
    },

    /**
     * Add this new WhatsApp job
     */
    sendWhatsAppMessage: async () => {
        const phoneNumber = envConfig.WHATSAPP_NUMBER;
        const message = `Cron job triggered at ${new Date().toLocaleString()}`;

        if (!phoneNumber) {

            return;
        }

        const service = getWhatsAppService();
        if (!service) {

            return;
        }

        const sent = await service.sendMessage(phoneNumber, message);
        if (sent) {

        }
    },

    /**
     * Check for overdue invoices
     */
    checkOverdueInvoices: async () => {


        const result = await invoiceNotificationService.processOverdueInvoices();

        console.log(`[${new Date().toISOString()}] 📊 Overdue notification summary:`, {
            total: result.total,
            sent: result.sent,
            failed: result.failed
        });
    },

    /**
     * Daily summary of all pending payments
     * @returns 
     */
    sendDailyPaymentSummary: async () => {


        const invoices = await invoiceNotificationService.findInvoicesWithRestAmount();

        if (invoices.length === 0) {

            return;
        }




        const adminPhone = envConfig.WHATSAPP_NUMBER;
        if (adminPhone) {
            // Send admin summary
        }
    },

    /**
     * Check invoices with rest amount and send reminders
     */
    checkInvoiceRestAmounts: async () => {

        
        const result = await invoiceNotificationService.processAllRestAmountInvoices();
        
        console.log(`[${new Date().toISOString()}] 📊 Invoice reminder summary:`, {
            total: result.total,
            sent: result.sent,
            failed: result.failed,
            skipped: result.skipped
        });
    },
};



/**
 * List all cron jobs with their configurations
 */
/**
 * Job registry.
 *
 * ---------------------------------------------------------------------------
 * READ THIS BEFORE ENABLING CRON JOBS
 * ---------------------------------------------------------------------------
 * None of these have ever actually run: cronService.initializeJobs() was never
 * called. That was almost certainly an accident, but it is also the only reason
 * the schedules below never caused an incident.
 *
 * As previously written, `invoiceReminder` ran EVERY 30 SECONDS and, on each
 * tick, scanned the invoice table and sent a WhatsApp message to every customer
 * with an outstanding balance. That is roughly 2,880 messages per customer per
 * day. It would have read as spam, and WhatsApp would have banned the number.
 *
 * Schedules are now set to sane intervals, and the whole scheduler is gated
 * behind ENABLE_CRON_JOBS so turning it on is a deliberate act. Verify the
 * recipient logic against a test number BEFORE setting that flag in production.
 */
export const cronJobConfigs: CronJobConfig[] = [
    {
        name: 'cleanup',
        schedule: cronSchedules.dailyMidnight,
        task: cronJobs.cleanupOldData,
        enabled: envConfig.NODE_ENV === 'production',
        description: 'Cleans up old data every day at midnight',
    },
    {
        name: 'dailyReports',
        schedule: cronSchedules.dailyMidnight,
        task: cronJobs.sendDailyReports,
        enabled: true,
        description: 'Sends daily reports at midnight',
    },
    {
        name: 'externalSync',
        schedule: cronSchedules.hourly,
        task: cronJobs.syncExternalData,
        enabled: envConfig.NODE_ENV !== 'test',
        description: 'Syncs external data every hour',
    },
    {
        name: 'backup',
        schedule: cronSchedules.weeklyMonday,
        task: cronJobs.backupDatabase,
        enabled: envConfig.NODE_ENV === 'production',
        description: 'Creates database backup every Monday at 1 AM',
    },
    /**
     * Development-only heartbeat. It sends a WhatsApp message to
     * WHATSAPP_NUMBER, so it must never be enabled in production.
     */
    {
        name: 'whatsappMessage',
        schedule: cronSchedules.hourly,
        task: cronJobs.sendWhatsAppMessage,
        enabled: false,
        description: 'Development heartbeat — sends a test WhatsApp message',
    },
    /**
     * Customer-facing payment reminders.
     *
     * Was every 30 seconds. Now once a day at 10:00, which is the most any
     * customer should hear from us about the same unpaid invoice. Note that
     * processAllRestAmountInvoices() does not currently check
     * last_reminder_sent before sending, so a customer receives one message per
     * run regardless — daily is therefore the floor, not a throttle.
     */
    {
        name: 'invoiceReminder',
        schedule: cronSchedules.dailyTenAM,
        task: cronJobs.checkInvoiceRestAmounts,
        enabled: true,
        description: 'Sends WhatsApp payment reminders for invoices with a balance',
    },
    /**
     * Overdue escalation. Every 6 hours is defensible for genuinely overdue
     * accounts, and this was already the schedule.
     */
    {
        name: 'overdueCheck',
        schedule: cronSchedules.every6Hours,
        task: cronJobs.checkOverdueInvoices,
        enabled: true,
        description: 'Checks for overdue invoices and sends urgent notifications',
    },
    /**
     * Internal summary to staff, not customers.
     */
    {
        name: 'dailySummary',
        schedule: cronSchedules.dailyNineAM,
        task: cronJobs.sendDailyPaymentSummary,
        enabled: true,
        description: 'Sends daily summary of pending payments',
    },
];