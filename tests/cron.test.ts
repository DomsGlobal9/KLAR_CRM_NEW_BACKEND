import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/services/whatsapp.service', () => ({ default: () => null }));
vi.mock('../src/services/invoiceNotification.service', () => ({
    default: {
        processOverdueInvoices: vi.fn(async () => ({ total: 0, sent: 0, failed: 0 })),
        processAllRestAmountInvoices: vi.fn(async () => ({ total: 0, sent: 0, failed: 0, skipped: 0 })),
        findInvoicesWithRestAmount: vi.fn(async () => []),
    },
}));

import cron from 'node-cron';
import { cronJobConfigs, cronSchedules } from '../src/config/cron.config';

/**
 * Guards against a customer-facing job being pointed at a sub-minute schedule.
 *
 * As originally written, `invoiceReminder` ran every 30 seconds and messaged
 * every customer with an outstanding balance on each tick — ~2,880 WhatsApp
 * messages per customer per day. It only never fired because the scheduler was
 * never started.
 */
const SUB_MINUTE = /^\*\/\d+ /;

const findJob = (name: string) => cronJobConfigs.find(c => c.name === name)!;

describe('cron schedules', () => {

    it('every schedule is valid cron syntax', () => {
        for (const job of cronJobConfigs) {
            expect(cron.validate(job.schedule), `${job.name}: ${job.schedule}`).toBe(true);
        }
    });

    it('no ENABLED job runs more often than once a minute', () => {
        for (const job of cronJobConfigs.filter(j => j.enabled)) {
            expect(SUB_MINUTE.test(job.schedule), `${job.name} is sub-minute`).toBe(false);
        }
    });

    it('the customer-facing invoice reminder runs at most daily', () => {
        const job = findJob('invoiceReminder');

        expect(job.schedule).toBe(cronSchedules.dailyTenAM);
        expect(SUB_MINUTE.test(job.schedule)).toBe(false);
    });

    it('the WhatsApp heartbeat is disabled — it messages a real number', () => {
        expect(findJob('whatsappMessage').enabled).toBe(false);
    });

    it('job names are unique, so none silently overwrites another', () => {
        const names = cronJobConfigs.map(j => j.name);

        expect(new Set(names).size).toBe(names.length);
    });
});

describe('CronService.executeJob', () => {

    /**
     * Fresh import per test: the service is a singleton holding run state.
     */
    const loadService = async () => {
        vi.resetModules();
        const mod = await import('../src/services/cron.service');
        return mod.default;
    };

    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('awaits async tasks, so failures are caught rather than unhandled', async () => {
        const service = await loadService();

        const task = vi.fn(async () => { throw new Error('job blew up'); });

        // Previously task() was called without await, so this rejection escaped
        // the try/catch entirely and surfaced as an unhandled rejection.
        await expect(
            (service as any).executeJob({ name: 'failing', task, enabled: true, schedule: '* * * * *', description: '' })
        ).resolves.toBeUndefined();

        expect(task).toHaveBeenCalledOnce();
        expect(console.error).toHaveBeenCalled();
    });

    it('does not start a job that is already running', async () => {
        const service = await loadService();

        let release = () => {};
        const gate = new Promise<void>(resolve => { release = resolve; });
        const task = vi.fn(() => gate);

        const config = { name: 'slow', task, enabled: true, schedule: '* * * * *', description: '' };

        const first = (service as any).executeJob(config);
        const second = (service as any).executeJob(config);

        await second; // returns immediately — skipped

        expect(task).toHaveBeenCalledOnce();

        release();
        await first;
    });

    it('frees the running lock after a failure, so the job can run again', async () => {
        const service = await loadService();

        const task = vi.fn(async () => { throw new Error('nope'); });
        const config = { name: 'flaky', task, enabled: true, schedule: '* * * * *', description: '' };

        await (service as any).executeJob(config);
        await (service as any).executeJob(config);

        // A failed run must not permanently wedge the job.
        expect(task).toHaveBeenCalledTimes(2);
    });

    it('registers only enabled jobs', async () => {
        const service = await loadService();

        service.initializeJobs();

        expect(service.getJobStatus('whatsappMessage')).toBe(false);
        expect(service.getJobStatus('invoiceReminder')).toBe(true);

        service.stopAllJobs();
    });
});
