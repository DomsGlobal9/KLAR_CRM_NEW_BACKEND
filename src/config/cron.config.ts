import invoiceNotificationService from '../services/invoiceNotification.service';
import whatsappService from '../services/whatsapp.service';
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
        console.log(`[${new Date().toISOString()}] 🔔 30-second cron job triggered - Hello from cron job!`);
    },

    /**
     * Example: Clean up old data
     */
    cleanupOldData: () => {
        console.log('Running cleanup job...');
        /**
         * Add your cleanup logic here
         */
    },

    /**
     * Example: Send daily reports
     */
    sendDailyReports: () => {
        console.log('Sending daily reports...');
        /**
         * Add your report sending logic here
         */
    },

    /**
     * Example: Sync external data
     */
    syncExternalData: () => {
        console.log('Syncing external data...');
        /**
         * Add your sync logic here
         */
    },

    /**
     * Example: Database backup
     */
    backupDatabase: () => {
        console.log('Creating database backup...');
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
            console.log('❌ WhatsApp number not configured in .env');
            return;
        }

        const sent = await whatsappService.sendMessage(phoneNumber, message);
        if (sent) {
            console.log(`✅ WhatsApp message sent to ${phoneNumber} at ${new Date().toISOString()}`);
        }
    },

    /**
     * Check for overdue invoices
     */
    checkOverdueInvoices: async () => {
        console.log(`[${new Date().toISOString()}] 🔍 Checking for overdue invoices...`);

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
        console.log(`[${new Date().toISOString()}] 📊 Sending daily payment summary...`);

        const invoices = await invoiceNotificationService.findInvoicesWithRestAmount();

        if (invoices.length === 0) {
            console.log('✅ No pending payments today');
            return;
        }

        console.log(`📋 Total pending invoices: ${invoices.length}`);
        console.log(`💰 Total outstanding: ${invoices.reduce((sum, inv) => sum + (inv.rest_amount || 0), 0).toFixed(2)}`);

        const adminPhone = envConfig.WHATSAPP_NUMBER;
        if (adminPhone) {
            // Send admin summary
        }
    },

    /**
     * Check invoices with rest amount and send reminders
     */
    checkInvoiceRestAmounts: async () => {
        console.log(`[${new Date().toISOString()}] 🔍 Checking invoices with remaining balance...`);
        
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