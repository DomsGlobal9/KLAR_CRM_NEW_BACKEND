import type { Server } from 'node:http';

/**
 * Process lifecycle: crash handling and graceful shutdown.
 *
 * Previously index.ts had no unhandledRejection or uncaughtException handler,
 * and gracefulShutdown() had an empty body — it logged nothing, closed no
 * resources, and left the Chromium and database handles open. A single
 * unhandled rejection anywhere in the app took the whole API down with no
 * diagnostic trail.
 *
 * The shutdown sequence lives here rather than in index.ts so it can be tested
 * without starting a real server.
 */

/**
 * How long to wait for in-flight requests to finish before forcing exit.
 */
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 15_000;

export interface ShutdownDeps {
    /** Stop accepting new connections and wait for in-flight requests. */
    closeServer: () => Promise<void>;
    /** Release the Postgres pool. */
    closePostgres: () => Promise<void>;
    /** Release Mongo connections. */
    closeMongo: () => Promise<void>;
    /** Shut down the shared Chromium instance. */
    closeBrowser: () => Promise<void>;
}

let shuttingDown = false;

/**
 * Reset guard state. Tests only.
 */
export const resetShutdownState = (): void => {
    shuttingDown = false;
};

/**
 * Close everything in dependency order, tolerating individual failures.
 *
 * Each step is isolated: one resource failing to close must not prevent the
 * others from being released. Returns the exit code the caller should use.
 */
export const shutdown = async (
    deps: ShutdownDeps,
    reason: string,
    exitCode = 0
): Promise<number> => {
    // A second SIGTERM while shutting down must not restart the sequence.
    if (shuttingDown) return exitCode;
    shuttingDown = true;

    console.log(`[shutdown] starting (${reason})`);

    // Stop taking new work first, so the rest can drain.
    const steps: Array<[string, () => Promise<void>]> = [
        ['http server', deps.closeServer],
        ['chromium', deps.closeBrowser],
        ['postgres', deps.closePostgres],
        ['mongodb', deps.closeMongo],
    ];

    let failed = false;

    for (const [name, close] of steps) {
        try {
            await close();
            console.log(`[shutdown] closed ${name}`);
        } catch (err: any) {
            failed = true;
            console.error(`[shutdown] failed to close ${name}:`, err?.message ?? err);
        }
    }

    console.log('[shutdown] complete');

    return failed && exitCode === 0 ? 1 : exitCode;
};

/**
 * Wire process-level signal and crash handlers.
 *
 * `exit` is injectable so tests can observe the intended exit code instead of
 * killing the test runner.
 */
export const registerProcessHandlers = (
    deps: ShutdownDeps,
    exit: (code: number) => void = code => process.exit(code)
): void => {

    const runShutdown = (reason: string, exitCode: number) => {
        // Hard deadline. If a resource hangs, exit anyway rather than sitting
        // in a half-dead state that a process manager cannot reason about.
        const timer = setTimeout(() => {
            console.error('[shutdown] timed out, forcing exit');
            exit(1);
        }, SHUTDOWN_TIMEOUT_MS);

        timer.unref();

        shutdown(deps, reason, exitCode)
            .then(code => {
                clearTimeout(timer);
                exit(code);
            })
            .catch(() => {
                clearTimeout(timer);
                exit(1);
            });
    };

    process.on('SIGTERM', () => runShutdown('SIGTERM', 0));
    process.on('SIGINT', () => runShutdown('SIGINT', 0));

    /**
     * An uncaught exception leaves the process in an undefined state — the only
     * safe response is to shut down and let the process manager restart us.
     */
    process.on('uncaughtException', (err: Error) => {
        console.error('[fatal] uncaughtException:', err?.stack ?? err);
        runShutdown('uncaughtException', 1);
    });

    /**
     * An unhandled rejection is logged but does NOT kill the process.
     *
     * Node's default is to terminate. For a CRM that must stay available, one
     * request's forgotten `.catch()` should not sign every other user out. The
     * trade-off is that these must actually be watched — they are real bugs, and
     * the log line is the only thing surfacing them.
     */
    process.on('unhandledRejection', (reason: unknown) => {
        const detail = reason instanceof Error ? reason.stack : JSON.stringify(reason);
        console.error('[error] unhandledRejection (process kept alive):', detail);
    });
};
