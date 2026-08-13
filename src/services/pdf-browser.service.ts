import puppeteer, { Browser, PDFOptions } from 'puppeteer-core';
import fs from 'fs';

/**
 * Shared system-browser renderer for PDF generation.
 *
 * Uses `puppeteer-core` with system-installed Chrome/Edge browser.
 * This avoids downloading ~400MB Chrome binaries into node_modules,
 * while rendering 100% pixel-perfect PDF layouts.
 */

const getSystemChromePath = (): string => {
    if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

    const candidatePaths = [
        // Windows
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        // Linux
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium',
        // macOS
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ];

    for (const path of candidatePaths) {
        if (fs.existsSync(path)) return path;
    }

    throw new Error('No system Chrome/Edge browser found. Please install Chrome or set CHROME_PATH environment variable.');
};

const LAUNCH_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
];

const MAX_CONCURRENT_PAGES = Number(process.env.PDF_MAX_CONCURRENCY) || 4;
const PAGE_TIMEOUT_MS = Number(process.env.PDF_TIMEOUT_MS) || 60_000;

const DEFAULT_PDF_OPTIONS: PDFOptions = {
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
};

let browserPromise: Promise<Browser> | null = null;

const isAlive = (browser: Browser): boolean => {
    const asAny = browser as any;
    return typeof asAny.connected === 'boolean' ? asAny.connected : asAny.isConnected();
};

export const getBrowser = async (): Promise<Browser> => {
    if (browserPromise) {
        try {
            const existing = await browserPromise;
            if (isAlive(existing)) return existing;
        } catch {
            // Relaunch if previous browser closed
        }
        browserPromise = null;
    }

    const executablePath = getSystemChromePath();
    const pending = puppeteer.launch({
        executablePath,
        headless: true,
        args: LAUNCH_ARGS,
    });
    browserPromise = pending;

    try {
        const browser = await pending;
        browser.on('disconnected', () => {
            if (browserPromise === pending) browserPromise = null;
        });
        return browser;
    } catch (error) {
        if (browserPromise === pending) browserPromise = null;
        throw error;
    }
};

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
        next();
    } else {
        activePages--;
    }
};

/**
 * Render HTML string to PDF buffer using system Chrome without inline-css distortion.
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

        try {
            await page.setContent(html, {
                waitUntil: 'networkidle0' as any,
                timeout: PAGE_TIMEOUT_MS,
            });
        } catch (contentError) {
            // Fallback if networkidle0 times out due to slow/blocked remote resources (e.g. logo images)
            await page.setContent(html, {
                waitUntil: 'domcontentloaded' as any,
                timeout: PAGE_TIMEOUT_MS,
            });
        }

        const pdf = await page.pdf({ ...DEFAULT_PDF_OPTIONS, ...options });
        return Buffer.from(pdf);
    } finally {
        if (page) {
            await page.close().catch(() => undefined);
        }
        releaseSlot();
    }
};

export const closeBrowser = async (): Promise<void> => {
    if (!browserPromise) return;
    const pending = browserPromise;
    browserPromise = null;
    try {
        const browser = await pending;
        await browser.close();
    } catch {}
};

export const getBrowserStats = () => ({
    launched: browserPromise !== null,
    activePages,
    queued: waiting.length,
    maxConcurrency: MAX_CONCURRENT_PAGES,
});
