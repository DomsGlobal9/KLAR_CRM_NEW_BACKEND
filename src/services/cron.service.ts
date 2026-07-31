import cron, { ScheduledTask } from 'node-cron';
import { cronJobConfigs, CronJobConfig } from '../config';

class CronService {
    private jobs: Map<string, ScheduledTask> = new Map();

    /**
     * Initialize all cron jobs
     */
    initializeJobs(): void {


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

            return;
        }

        /**
         * Validate cron schedule
         */
        if (!cron.validate(config.schedule)) {

            return;
        }

        try {
            const job = cron.schedule(config.schedule, () => {
                this.executeJob(config);
            });

            this.jobs.set(config.name, job);

        } catch (error) {

        }
    }

    /**
     * Execute a cron job with error handling
     */
    private async executeJob(config: CronJobConfig): Promise<void> {
        const startTime = Date.now();


        try {
            config.task();
            const duration = Date.now() - startTime;

        } catch (error) {

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

        }
    }

    /**
     * Stop all cron jobs
     */
    stopAllJobs(): void {
        this.jobs.forEach((job, name) => {
            job.stop();

        });
        this.jobs.clear();
    }

    /**
     * List all active cron jobs
     */
    listActiveJobs(): void {
        if (this.jobs.size === 0) {

            return;
        }

        this.jobs.forEach((_, name) => {
            const config = cronJobConfigs.find(c => c.name === name);
        });
    }

    /**
     * Get job status
     */
    getJobStatus(jobName: string): boolean {
        return this.jobs.has(jobName);
    }
}

export default new CronService();