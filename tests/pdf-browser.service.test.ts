import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * A fake Chromium. Records how many browsers were launched and, critically,
 * how many pages were opened versus closed — an imbalance is the leak that
 * v1.2.0 exists to fix.
 */
const { launch, state } = vi.hoisted(() => {
    const state = {
        launchCount: 0,
        pagesOpened: 0,
        pagesClosed: 0,
        /** Set to throw from page.pdf(), simulating a bad template. */
        failOnPdf: false,
        /** Set to make launch() itself reject. */
        failOnLaunch: false,
        /** Handlers registered via browser.on('disconnected', ...). */
        disconnectHandlers: [] as Array<() => void>,
        /** Resolves pending renders, for testing the concurrency gate. */
        pdfGate: null as null | Promise<void>,
        connected: true,
    };

    const makePage = () => ({
        setDefaultTimeout: vi.fn(),
        setContent: vi.fn(() => Promise.resolve()),
        pdf: vi.fn(async () => {
            if (state.pdfGate) await state.pdfGate;
            if (state.failOnPdf) throw new Error('bad template');
            return Buffer.from('%PDF-1.4 fake');
        }),
        close: vi.fn(() => {
            state.pagesClosed++;
            return Promise.resolve();
        }),
    });

    const makeBrowser = () => ({
        connected: true,
        newPage: vi.fn(() => {
            state.pagesOpened++;
            return Promise.resolve(makePage());
        }),
        close: vi.fn(() => Promise.resolve()),
        on: vi.fn((event: string, handler: () => void) => {
            if (event === 'disconnected') state.disconnectHandlers.push(handler);
        }),
    });

    const launch = vi.fn(() => {
        if (state.failOnLaunch) return Promise.reject(new Error('chromium missing'));
        state.launchCount++;
        return Promise.resolve(makeBrowser());
    });

    return { launch, state };
});

vi.mock('puppeteer', () => ({
    default: { launch },
    launch,
}));

import {
    renderPdf,
    closeBrowser,
    getBrowserStats,
} from '../src/services/pdf-browser.service';

beforeEach(async () => {
    await closeBrowser();

    state.launchCount = 0;
    state.pagesOpened = 0;
    state.pagesClosed = 0;
    state.failOnPdf = false;
    state.failOnLaunch = false;
    state.disconnectHandlers = [];
    state.pdfGate = null;
    launch.mockClear();
});

describe('renderPdf — the leak fix', () => {

    it('closes the page after a successful render', async () => {
        await renderPdf('<h1>hi</h1>');

        expect(state.pagesOpened).toBe(1);
        expect(state.pagesClosed).toBe(1);
    });

    it('closes the page even when rendering THROWS (this was the leak)', async () => {
        state.failOnPdf = true;

        await expect(renderPdf('<broken>')).rejects.toThrow('bad template');

        // Before v1.2.0 the close() call sat after the throw and never ran,
        // orphaning a Chromium process permanently.
        expect(state.pagesOpened).toBe(1);
        expect(state.pagesClosed).toBe(1);
    });

    it('leaks nothing across a long run of mixed successes and failures', async () => {
        for (let i = 0; i < 20; i++) {
            state.failOnPdf = i % 3 === 0;

            await renderPdf('<p>x</p>').catch(() => undefined);
        }

        expect(state.pagesOpened).toBe(20);
        expect(state.pagesClosed).toBe(20);
        expect(getBrowserStats().activePages).toBe(0);
    });

    it('propagates the original error, not a close() error', async () => {
        state.failOnPdf = true;

        await expect(renderPdf('<broken>')).rejects.toThrow('bad template');
    });

    it('returns a Buffer', async () => {
        const result = await renderPdf('<h1>hi</h1>');

        expect(Buffer.isBuffer(result)).toBe(true);
    });
});

describe('renderPdf — browser reuse', () => {

    it('launches Chromium ONCE and reuses it (was once per request)', async () => {
        await renderPdf('<p>1</p>');
        await renderPdf('<p>2</p>');
        await renderPdf('<p>3</p>');

        expect(state.launchCount).toBe(1);
        expect(state.pagesOpened).toBe(3);
    });

    it('shares a single launch between concurrent first calls', async () => {
        await Promise.all([
            renderPdf('<p>a</p>'),
            renderPdf('<p>b</p>'),
            renderPdf('<p>c</p>'),
        ]);

        expect(state.launchCount).toBe(1);
    });

    it('relaunches transparently after Chromium dies', async () => {
        await renderPdf('<p>1</p>');
        expect(state.launchCount).toBe(1);

        // Simulate Chromium being OOM-killed or crashing.
        state.disconnectHandlers.forEach(handler => handler());

        await renderPdf('<p>2</p>');

        expect(state.launchCount).toBe(2);
    });

    it('does not cache a failed launch permanently', async () => {
        state.failOnLaunch = true;
        await expect(renderPdf('<p>x</p>')).rejects.toThrow('chromium missing');

        // A transient launch failure must not disable PDFs for the whole
        // lifetime of the process.
        state.failOnLaunch = false;
        await expect(renderPdf('<p>x</p>')).resolves.toBeInstanceOf(Buffer);
    });

    it('releases its concurrency slot when launch fails', async () => {
        state.failOnLaunch = true;

        await expect(renderPdf('<p>x</p>')).rejects.toThrow();

        expect(getBrowserStats().activePages).toBe(0);
    });
});

describe('renderPdf — concurrency limit', () => {

    it('caps simultaneous renders and queues the rest', async () => {
        let openGate = () => {};
        state.pdfGate = new Promise<void>(resolve => { openGate = resolve; });

        const max = getBrowserStats().maxConcurrency;

        // Fire twice the limit.
        const renders = Array.from({ length: max * 2 }, () => renderPdf('<p>x</p>'));

        // Let the first wave reach the gate.
        await new Promise(resolve => setImmediate(resolve));

        const stats = getBrowserStats();
        expect(stats.activePages).toBe(max);
        expect(stats.queued).toBe(max);

        openGate();
        state.pdfGate = null;
        await Promise.all(renders);

        // Everything drains, and nothing is left holding a slot.
        expect(getBrowserStats().activePages).toBe(0);
        expect(getBrowserStats().queued).toBe(0);
        expect(state.pagesClosed).toBe(max * 2);
    });
});

describe('closeBrowser', () => {

    it('is safe to call when nothing was ever launched', async () => {
        await expect(closeBrowser()).resolves.toBeUndefined();
    });

    it('shuts the browser down and allows a later relaunch', async () => {
        await renderPdf('<p>1</p>');
        expect(state.launchCount).toBe(1);

        await closeBrowser();
        expect(getBrowserStats().launched).toBe(false);

        await renderPdf('<p>2</p>');
        expect(state.launchCount).toBe(2);
    });
});
