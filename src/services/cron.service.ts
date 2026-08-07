import cron, { ScheduledTask } from 'node-cron';
import { cronJobConfigs, CronJobConfig } from '../config';

class CronService {
    private jobs: Map<string, ScheduledTask> = new Map();

    /** Jobs currently mid-run, so a slow job cannot overlap itself. */
    private running: Set<string> = new Set();

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
     * Execute a cron job with error handling.
     *
     * Every task in the registry is async, but this used to call config.task()
     * WITHOUT awaiting it. The try/catch therefore caught nothing — the
     * function returned immediately and any rejection surfaced later as an
     * unhandled rejection, with no indication of which job produced it.
     *
     * Awaiting also serialises a job against itself: a run that overruns its
     * interval can no longer stack up concurrent copies.
     */
    private async executeJob(config: CronJobConfig): Promise<void> {
        // Skip this tick if the previous run has not finished.
        if (this.running.has(config.name)) {
            console.warn(`[cron] ${config.name} still running, skipping this tick`);
            return;
        }

        this.running.add(config.name);

        const startTime = Date.now();

        try {
            await config.task();

            console.log(`[cron] ${config.name} completed in ${Date.now() - startTime}ms`);
        } catch (error: any) {
            console.error(`[cron] ${config.name} failed:`, error?.stack ?? error);
        } finally {
            this.running.delete(config.name);
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