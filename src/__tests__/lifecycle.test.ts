import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shutdown, resetShutdownState, ShutdownDeps } from '../lifecycle';

/**
 * Builds a set of shutdown dependencies that record the order they were closed
 * in, so we can assert the sequence as well as the fact of closure.
 */
const makeDeps = (overrides: Partial<ShutdownDeps> = {}) => {
    const order: string[] = [];

    const deps: ShutdownDeps = {
        closeServer: vi.fn(async () => { order.push('server'); }),
        closeBrowser: vi.fn(async () => { order.push('browser'); }),
        closePostgres: vi.fn(async () => { order.push('postgres'); }),
        closeMongo: vi.fn(async () => { order.push('mongo'); }),
        ...overrides,
    };

    return { deps, order };
};

beforeEach(() => {
    resetShutdownState();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('shutdown', () => {

    it('closes every resource (previously it closed none)', async () => {
        const { deps } = makeDeps();

        await shutdown(deps, 'test');

        expect(deps.closeServer).toHaveBeenCalledOnce();
        expect(deps.closeBrowser).toHaveBeenCalledOnce();
        expect(deps.closePostgres).toHaveBeenCalledOnce();
        expect(deps.closeMongo).toHaveBeenCalledOnce();
    });

    it('stops accepting connections before releasing anything else', async () => {
        const { deps, order } = makeDeps();

        await shutdown(deps, 'test');

        // The server must close first so in-flight work can drain against
        // resources that are still alive.
        expect(order[0]).toBe('server');
        expect(order).toEqual(['server', 'browser', 'postgres', 'mongo']);
    });

    it('returns the requested exit code', async () => {
        const { deps } = makeDeps();

        expect(await shutdown(deps, 'test', 0)).toBe(0);

        resetShutdownState();
        expect(await shutdown(deps, 'crash', 1)).toBe(1);
    });

    it('still closes the remaining resources when one fails', async () => {
        const { deps } = makeDeps({
            closeBrowser: vi.fn(async () => { throw new Error('chromium hung'); }),
        });

        await shutdown(deps, 'test');

        // A stuck browser must not strand the database connections.
        expect(deps.closePostgres).toHaveBeenCalledOnce();
        expect(deps.closeMongo).toHaveBeenCalledOnce();
    });

    it('reports a non-zero exit code when a resource fails to close', async () => {
        const { deps } = makeDeps({
            closePostgres: vi.fn(async () => { throw new Error('pool busy'); }),
        });

        expect(await shutdown(deps, 'test', 0)).toBe(1);
    });

    it('does not downgrade an existing failure exit code', async () => {
        const { deps } = makeDeps({
            closeMongo: vi.fn(async () => { throw new Error('nope'); }),
        });

        expect(await shutdown(deps, 'crash', 1)).toBe(1);
    });

    it('ignores a second shutdown request already in progress', async () => {
        const { deps } = makeDeps();

        await shutdown(deps, 'SIGTERM');
        await shutdown(deps, 'SIGTERM again');

        // A repeated signal must not re-run the sequence against already
        // closed resources.
        expect(deps.closeServer).toHaveBeenCalledOnce();
        expect(deps.closePostgres).toHaveBeenCalledOnce();
    });

    it('never rejects, so the caller can always exit cleanly', async () => {
        const { deps } = makeDeps({
            closeServer: vi.fn(async () => { throw new Error('a'); }),
            closeBrowser: vi.fn(async () => { throw new Error('b'); }),
            closePostgres: vi.fn(async () => { throw new Error('c'); }),
            closeMongo: vi.fn(async () => { throw new Error('d'); }),
        });

        await expect(shutdown(deps, 'test')).resolves.toBe(1);
    });
});
