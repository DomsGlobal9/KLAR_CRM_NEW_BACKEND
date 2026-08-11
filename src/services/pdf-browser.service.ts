import html_to_pdf from 'html-pdf-node';

/**
 * Shared renderer for PDF generation.
 * Uses lightweight html-pdf-node instead of heavy Puppeteer/Chromium processes.
 */

const DEFAULT_PDF_OPTIONS = {
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
};

/**
 * Render HTML string to a PDF buffer asynchronously.
 */
export const renderPdf = async (
    html: string,
    options: any = {}
): Promise<Buffer> => {
    const file = { content: html };
    const pdfOptions = {
        format: options.format || DEFAULT_PDF_OPTIONS.format,
        printBackground: options.printBackground !== undefined ? options.printBackground : DEFAULT_PDF_OPTIONS.printBackground,
        margin: options.margin || DEFAULT_PDF_OPTIONS.margin,
    };

    const pdfBuffer = await html_to_pdf.generatePdf(file, pdfOptions);
    return Buffer.from(pdfBuffer);
};

/**
 * Backwards compatibility helper functions.
 */
export const getBrowser = async (): Promise<any> => null;
export const closeBrowser = async (): Promise<void> => {};
export const getBrowserStats = () => ({
    launched: false,
    activePages: 0,
    queued: 0,
    maxConcurrency: 1,
});
