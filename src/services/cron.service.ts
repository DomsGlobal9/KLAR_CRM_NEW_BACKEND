import cron, { ScheduledTask } from 'node-cron';
import { cronJobConfigs, CronJobConfig } from '../config';

class CronService {
    private jobs: Map<string, ScheduledTask> = new Map();

    /**
     * Initialize all cron jobs
     */
    initializeJobs(): void {
        console.log('Initializing cron jobs...');

        cronJobConfigs.forEach((config: CronJobConfig) => {
            this.registerJob(config);
        });

        this.listActiveJobs();
    }

    /**
     * Register a single cron job
     */
    registerJob(config: CronJobConfig): void {
        if (!config.enabled) {
            console.log(`Cron job "${config.name}" is disabled and will not be scheduled.`);
            return;
        }

        /**
         * Validate cron schedule
         */
        if (!cron.validate(config.schedule)) {
            console.error(`Invalid cron schedule for job "${config.name}": ${config.schedule}`);
            return;
        }

        try {
            const job = cron.schedule(config.schedule, () => {
                this.executeJob(config);
            });

            this.jobs.set(config.name, job);
            console.log(`✅ Cron job "${config.name}" scheduled: ${config.schedule} - ${config.description}`);
        } catch (error) {
            console.error(`Failed to schedule cron job "${config.name}":`, error);
        }
    }

    /**
     * Execute a cron job with error handling
     */
    private async executeJob(config: CronJobConfig): Promise<void> {
        const startTime = Date.now();
        console.log(`[${new Date().toISOString()}] Starting cron job: ${config.name}`);

        try {
            config.task();
            const duration = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] Completed cron job: ${config.name} (${duration}ms)`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error in cron job "${config.name}":`, error);
        }
    }

    /**
     * Stop a specific cron job
     */
    stopJob(jobName: string): void {
        const job = this.jobs.get(jobName);
        if (job) {
            job.stop();
            this.jobs.delete(jobName);
            console.log(`Cron job "${jobName}" stopped.`);
        }
    }

    /**
     * Stop all cron jobs
     */
    stopAllJobs(): void {
        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`Cron job "${name}" stopped.`);
        });
        this.jobs.clear();
    }

    /**
     * List all active cron jobs
     */
    listActiveJobs(): void {
        if (this.jobs.size === 0) {
            console.log('No active cron jobs.');
            return;
        }

        console.log('\n=== Active Cron Jobs ===');
        this.jobs.forEach((_, name) => {
            const config = cronJobConfigs.find(c => c.name === name);
            console.log(`- ${name}: ${config?.schedule} (${config?.description})`);
        });
        console.log('========================\n');
    }

    /**
     * Get job status
     */
    getJobStatus(jobName: string): boolean {
        return this.jobs.has(jobName);
    }
}

export default new CronService();