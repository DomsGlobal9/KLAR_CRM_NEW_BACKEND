import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const quotePdfService = {
    async generateHTML(quote: any): Promise<string> {
        const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
        let base64Logo = '';
        try {
            const bitmap = fs.readFileSync(logoPath);
            base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
        } catch (e) { console.error("Logo missing"); }

        const templateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { margin: 15mm; }
                body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 0; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; }
                .doc-title { text-align: center; color: #d32f2f; font-size: 20pt; margin: 20px 0; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #4b0082; color: white; border: 1px solid #ccc; padding: 10px; text-align: left; }
                td { border: 1px solid #ccc; padding: 10px; }
                .total-row { background: #fff5f5; font-weight: bold; font-size: 12pt; }
                .company-details { text-align: right; font-size: 8pt; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${base64Logo}" style="max-height: 60px;" />
                <div class="company-details">
                    <strong>KLAR TRAVELS</strong><br>
                    Hyderabad - 500 0073<br>
                    GSTIN: 36BGCPS2420P1Z4
                </div>
            </div>

            <div class="doc-title">COMMERCIAL QUOTATION</div>
            <p><strong>Quote No:</strong> {{quote.quote_number}}</p>
            <p><strong>Client:</strong> {{quote.client_name}}</p>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align:center;">Qty</th>
                        <th style="text-align:right;">Unit Price</th>
                        <th style="text-align:right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each quote.line_items}}
                    <tr>
                        <td>{{description}}</td>
                        <td style="text-align:center;">{{quantity}}</td>
                        <td style="text-align:right;">{{unit_price}}</td>
                        <td style="text-align:right;">{{total}}</td>
                    </tr>
                    {{/each}}
                    <tr class="total-row">
                        <td colspan="3" style="text-align:right;">SUBTOTAL</td>
                        <td style="text-align:right;">{{quote.subtotal}}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align:right;">GST ({{quote.tax_rate}}%)</td>
                        <td style="text-align:right;">{{quote.tax_amount}}</td>
                    </tr>
                    <tr class="total-row" style="color: #d32f2f;">
                        <td colspan="3" style="text-align:right;">GRAND TOTAL</td>
                        <td style="text-align:right;">{{quote.currency}} {{quote.final_amount}}</td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>`;

        const template = handlebars.compile(templateHtml);
        return template({ quote });
    },

    async generateBuffer(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();
        return Buffer.from(pdf);
    }
};