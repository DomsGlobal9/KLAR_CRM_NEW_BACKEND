import puppeteer, { Browser, PDFOptions } from 'puppeteer';

/**
 * Shared headless-browser renderer for all PDF generation.
 *
 * Previously each of the six PDF services called puppeteer.launch() per request,
 * spawning a full Chromium process (~250-400 MB) and closing it at the end. Two
 * problems:
 *
 *   1. Cost. Launching Chromium takes 1-3 seconds and a few hundred megabytes.
 *      Doing that per request meant a handful of concurrent PDFs could outweigh
 *      everything else running on the box.
 *
 *   2. A leak. None of the call sites used try/finally, so if page.pdf() threw —
 *      malformed HTML, a template error, a timeout — browser.close() never ran
 *      and the Chromium process was orphaned permanently. Over days of uptime
 *      that is a guaranteed out-of-memory kill, which is exactly what blocks
 *      running 24/7.
 *
 * This module keeps ONE browser alive for the process and hands out pages from
 * it. Pages are always closed in a finally block. If Chromium dies or is killed
 * externally, the next call transparently relaunches it.
 */

const LAUNCH_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
];

/**
 * Caps how many pages render at once. Each open page costs memory, so without a
 * limit a burst of requests reintroduces the original problem in a new form.
 * Work beyond the limit queues rather than being rejected.
 */
const MAX_CONCURRENT_PAGES = Number(process.env.PDF_MAX_CONCURRENCY) || 4;

/**
 * Guards against a hung render holding a slot forever.
 */
const PAGE_TIMEOUT_MS = Number(process.env.PDF_TIMEOUT_MS) || 60_000;

/**
 * Margins and format were identical at all six original call sites.
 */
const DEFAULT_PDF_OPTIONS: PDFOptions = {
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
};

/**
 * The in-flight launch, so concurrent callers arriving during startup share one
 * Chromium rather than each starting their own.
 */
let browserPromise: Promise<Browser> | null = null;

const isAlive = (browser: Browser): boolean => {
    // puppeteer >= 23 exposes `connected`; `isConnected()` is the older spelling.
    const asAny = browser as any;
    return typeof asAny.connected === 'boolean' ? asAny.connected : asAny.isConnected();
};

/**
 * Return the shared browser, launching or relaunching it as needed.
 */
export const getBrowser = async (): Promise<Browser> => {
    if (browserPromise) {
        try {
            const existing = await browserPromise;
            if (isAlive(existing)) return existing;
        } catch {
            // Previous launch failed; fall through and try again.
        }

        browserPromise = null;
    }

    const pending = puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
    browserPromise = pending;

    try {
        const browser = await pending;

        // If Chromium exits for any reason, drop the handle so the next caller
        // launches a fresh one instead of using a dead browser.
        browser.on('disconnected', () => {
            if (browserPromise === pending) browserPromise = null;
        });

        return browser;
    } catch (error) {
        // Never leave a rejected promise cached — that would make the failure
        // permanent for the lifetime of the process.
        if (browserPromise === pending) browserPromise = null;
        throw error;
    }
};

/**
 * Simple FIFO semaphore. Resolves once a render slot is free.
 */
let activePages = 0;
const waiting: Array<() => void> = [];

const acquireSlot = (): Promise<void> => {
    if (activePages < MAX_CONCURRENT_PAGES) {
        activePages++;
        return Promise.resolve();
    }

    return new Promise<void>(resolve => waiting.push(resolve));
};

const releaseSlot = (): void => {
    const next = waiting.shift();

    if (next) {
        // Hand the slot straight to the next waiter; activePages stays level.
        next();
    } else {
        activePages--;
    }
};

/**
 * Render HTML to a PDF buffer.
 *
 * The page is always closed, including when rendering throws — that guarantee
 * is the whole point of this function.
 */
export const renderPdf = async (
    html: string,
    options: PDFOptions = {}
): Promise<Buffer> => {
    await acquireSlot();

    let page: Awaited<ReturnType<Browser['newPage']>> | null = null;

    try {
        const browser = await getBrowser();
        page = await browser.newPage();

        page.setDefaultTimeout(PAGE_TIMEOUT_MS);

        await page.setContent(html, {
            // Runtime accepts 'networkidle0' but setContent's types only list the
            // 'load' variants, so the cast is required. This matches what every
            // original call site did.
            waitUntil: 'networkidle0' as any,
            timeout: PAGE_TIMEOUT_MS,
        });

        const pdf = await page.pdf({ ...DEFAULT_PDF_OPTIONS, ...options });

        return Buffer.from(pdf);
    } finally {
        if (page) {
            // Closing a page must never mask the original error.
            await page.close().catch(() => undefined);
        }

        releaseSlot();
    }
};

/**
 * Shut the shared browser down. Called during graceful shutdown so Chromium
 * does not outlive the Node process.
 */
export const closeBrowser = async (): Promise<void> => {
    if (!browserPromise) return;

    const pending = browserPromise;
    browserPromise = null;

    try {
        const browser = await pending;
        await browser.close();
    } catch {
        // Already gone, or never started successfully. Nothing to clean up.
    }
};

/**
 * Exposed for tests and health checks.
 */
export const getBrowserStats = () => ({
    launched: browserPromise !== null,
    activePages,
    queued: waiting.length,
    maxConcurrency: MAX_CONCURRENT_PAGES,
});
