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
     * Runs every 30 seconds (for testing)
     */
    every30Seconds: '*/30 * * * * *',

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
    {
        name: 'thirtySecondMessage',
        schedule: cronSchedules.every30Seconds,
        task: cronJobs.displayThirtySecondMessage,
        enabled: true,
        description: 'Displays a message every 30 seconds',
    },
    /**
     * Add this new WhatsApp job configuration
     */
    {
        name: 'whatsappMessage',
        schedule: cronSchedules.every30Seconds,
        task: cronJobs.sendWhatsAppMessage,
        enabled: true,
        description: 'Sends WhatsApp message every 30 seconds',
    },
    /**
     * Check invoices every hour (less frequent than 30 seconds)
     */
    {
        name: 'invoiceReminder',
        // schedule: cronSchedules.everyHour,
        schedule: cronSchedules.every30Seconds,
        task: cronJobs.checkInvoiceRestAmounts,
        enabled: true,
        description: 'Checks invoices with rest_amount and sends WhatsApp reminders',
    },
    /**
     * Check overdue invoices every 6 hours
     */
    {
        name: 'overdueCheck',
        schedule: cronSchedules.every6Hours,
        task: cronJobs.checkOverdueInvoices,
        enabled: true,
        description: 'Checks for overdue invoices and sends urgent notifications',
    },
    /**
     * Daily summary at 9 AM
     */
    {
        name: 'dailySummary',
        schedule: '0 9 * * *',
        task: cronJobs.sendDailyPaymentSummary,
        enabled: true,
        description: 'Sends daily summary of pending payments',
    },
];