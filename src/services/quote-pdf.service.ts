// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';
// import fs from 'fs';
// import path from 'path';

// export const quotePdfService = {
//     async generateHTML(quote: any): Promise<string> {
//         const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
//         let base64Logo = '';
//         try {
//             const bitmap = fs.readFileSync(logoPath);
//             base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
//         } catch (e) { console.error("Logo missing"); }

//         const templateHtml = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//             <style>
//                 @page { margin: 15mm; }
//                 body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 0; }
//                 .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; }
//                 .doc-title { text-align: center; color: #d32f2f; font-size: 20pt; margin: 20px 0; font-weight: bold; }
//                 table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//                 th { background: #4b0082; color: white; border: 1px solid #ccc; padding: 10px; text-align: left; }
//                 td { border: 1px solid #ccc; padding: 10px; }
//                 .total-row { background: #fff5f5; font-weight: bold; font-size: 12pt; }
//                 .company-details { text-align: right; font-size: 8pt; }
//             </style>
//         </head>
//         <body>
//             <div class="header">
//                 <img src="${base64Logo}" style="max-height: 60px;" />
//                 <div class="company-details">
//                     <strong>KLAR TRAVELS</strong><br>
//                     Hyderabad - 500 0073<br>
//                     GSTIN: 36BGCPS2420P1Z4
//                 </div>
//             </div>

//             <div class="doc-title">COMMERCIAL QUOTATION</div>
//             <p><strong>Quote No:</strong> {{quote.quote_number}}</p>
//             <p><strong>Client:</strong> {{quote.client_name}}</p>

//             <table>
//                 <thead>
//                     <tr>
//                         <th>Description</th>
//                         <th style="text-align:center;">Qty</th>
//                         <th style="text-align:right;">Unit Price</th>
//                         <th style="text-align:right;">Total</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {{#each quote.line_items}}
//                     <tr>
//                         <td>{{description}}</td>
//                         <td style="text-align:center;">{{quantity}}</td>
//                         <td style="text-align:right;">{{unit_price}}</td>
//                         <td style="text-align:right;">{{total}}</td>
//                     </tr>
//                     {{/each}}
//                     <tr class="total-row">
//                         <td colspan="3" style="text-align:right;">SUBTOTAL</td>
//                         <td style="text-align:right;">{{quote.subtotal}}</td>
//                     </tr>
//                     <tr>
//                         <td colspan="3" style="text-align:right;">GST ({{quote.tax_rate}}%)</td>
//                         <td style="text-align:right;">{{quote.tax_amount}}</td>
//                     </tr>
//                     <tr class="total-row" style="color: #d32f2f;">
//                         <td colspan="3" style="text-align:right;">GRAND TOTAL</td>
//                         <td style="text-align:right;">{{quote.currency}} {{quote.final_amount}}</td>
//                     </tr>
//                 </tbody>
//             </table>
//         </body>
//         </html>`;

//         const template = handlebars.compile(templateHtml);
//         return template({ quote });
//     },

//     async generateBuffer(html: string): Promise<Buffer> {
//         const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
//         const page = await browser.newPage();
//         await page.setContent(html, { waitUntil: 'networkidle0' });
//         const pdf = await page.pdf({ format: 'A4', printBackground: true });
//         await browser.close();
//         return Buffer.from(pdf);
//     }
// };












// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';
// import fs from 'fs';
// import path from 'path';

// export const quotePdfService = {
//     async generateHTML(quoteData: any): Promise<string> {
//         const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
//         let base64Logo = '';
//         try {
//             const bitmap = fs.readFileSync(logoPath);
//             base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
//         } catch (e) { console.error("Logo missing"); }

//         const templateHtml = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//             <style>
//                 @page { margin: 15mm; }
//                 body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 0; line-height: 1.4; font-size: 10pt; }
//                 .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; }
//                 .company-details { text-align: right; font-size: 8pt; color: #444; }
//                 .company-name { font-weight: bold; color: #4b0082; font-size: 14pt; }
//                 .doc-title { text-align: center; color: #d32f2f; font-size: 18pt; margin: 20px 0; font-weight: bold; text-decoration: underline; }
//                 table { width: 100%; border-collapse: collapse; margin: 20px 0; }
//                 th { background: #4b0082; color: white; border: 1px solid #ccc; padding: 10px; text-align: left; }
//                 td { border: 1px solid #ccc; padding: 10px; vertical-align: top; }
//                 .total-row { background: #fff5f5; font-weight: bold; }
//                 .summary-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; }
//             </style>
//         </head>
//         <body>
//             <div class="header">
//                 <img src="${base64Logo}" style="max-height: 60px;" />
//                 <div class="company-details">
//                     <div class="company-name">KLAR TRAVELS</div>
//                     #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
//                     HYDERABAD - 500 0073 | Tel: +914023745112 | GSTIN: 36BGCPS2420P1Z4
//                 </div>
//             </div>

//             <div class="doc-title">COMMERCIAL QUOTATION</div>

//             <div class="summary-box">
//                 <table style="border:none; margin:0;">
//                     <tr style="border:none;">
//                         <td style="border:none;"><strong>Client:</strong> {{client_name}}</td>
//                         <td style="border:none; text-align:right;"><strong>Quote No:</strong> {{quote_number}}</td>
//                     </tr>
//                     <tr style="border:none;">
//                         <td style="border:none;"><strong>Status:</strong> {{status}}</td>
//                         <td style="border:none; text-align:right;"><strong>Valid Until:</strong> {{valid_until}}</td>
//                     </tr>
//                 </table>
//             </div>

//             <table>
//                 <thead>
//                     <tr>
//                         <th>DESCRIPTION</th>
//                         <th style="text-align:center;">QTY</th>
//                         <th style="text-align:right;">UNIT PRICE ({{currency}})</th>
//                         <th style="text-align:right;">TOTAL ({{currency}})</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {{#each line_items}}
//                     <tr>
//                         <td>
//                             <strong>{{description}}</strong><br>
//                             <small>{{#each details.categories}}{{category_name}}: {{#each sub_services}}{{sub_service_name}}{{/each}} | {{/each}}</small>
//                         </td>
//                         <td style="text-align:center;">{{quantity}}</td>
//                         <td style="text-align:right;">{{unit_price}}</td>
//                         <td style="text-align:right;">{{total}}</td>
//                     </tr>
//                     {{/each}}
//                     <tr class="total-row">
//                         <td colspan="3" style="text-align:right;">SUBTOTAL</td>
//                         <td style="text-align:right;">{{subtotal}}</td>
//                     </tr>
//                     <tr>
//                         <td colspan="3" style="text-align:right;">GST ({{totals.tax_rate}}%)</td>
//                         <td style="text-align:right;">{{tax_amount}}</td>
//                     </tr>
//                     <tr class="total-row" style="color: #d32f2f; font-size: 14pt;">
//                         <td colspan="3" style="text-align:right;">NET PAYABLE</td>
//                         <td style="text-align:right;">{{currency}} {{final_amount}}</td>
//                     </tr>
//                 </tbody>
//             </table>

//             <div style="background:#f4f4f4; padding:15px; border-radius:4px;">
//                 <strong>Terms & Conditions:</strong><br>
//                 <p style="font-size: 8.5pt; white-space: pre-line;">{{terms_conditions}}</p>
//                 <br>
//                 <strong>Notes:</strong><br>
//                 <p style="font-size: 8.5pt;">{{notes}}</p>
//             </div>
//         </body>
//         </html>
//         `;

//         return handlebars.compile(templateHtml)(quoteData);
//     },

//     async generateBuffer(html: string): Promise<Buffer> {
//         const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
//         const page = await browser.newPage();
//         await page.setContent(html, { waitUntil: 'networkidle0' });
//         const pdf = await page.pdf({ format: 'A4', printBackground: true });
//         await browser.close();
//         return Buffer.from(pdf);
//     }
// };

















import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const quotePdfService = {
    async generateHTML(quoteData: any): Promise<string> {
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
                body { font-family: 'Arial', sans-serif; font-size: 10pt; color: #333; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; margin-bottom: 20px; }
                .doc-title { text-align: center; color: #d32f2f; font-size: 18pt; font-weight: bold; margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background: #4b0082; color: white; border: 1px solid #ccc; padding: 10px; text-align: left; }
                td { border: 1px solid #ccc; padding: 10px; vertical-align: top; }
                .total-row { background: #fff5f5; font-weight: bold; }
                .details-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; background: #fdfdfd; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${base64Logo}" style="max-height: 60px;" />
                <div style="text-align: right; font-size: 8pt;">
                    <strong>KLAR TRAVELS</strong><br>
                    HYDERABAD | Mob: +918099359377<br>
                    <strong>GSTIN: 36BGCPS2420P1Z4</strong>
                </div>
            </div>

            <div class="doc-title">COMMERCIAL QUOTATION</div>

            <div class="details-box">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <strong>Client:</strong> {{client_name}}<br>
                        <strong>Quote No:</strong> {{quote_number}}
                    </div>
                    <div style="text-align: right;">
                        <strong>Date:</strong> {{created_at}}<br>
                        <strong>Valid Until:</strong> {{valid_until}}
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>ITEM DESCRIPTION</th>
                        <th style="text-align:center;">QTY</th>
                        <th style="text-align:right;">UNIT COST</th>
                        <th style="text-align:right;">TOTAL ({{currency}})</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each line_items}}
                    <tr>
                        <td>
                            <strong>{{description}}</strong><br>
                            <small>
                                {{#each details.categories}}{{category_name}}: {{#each sub_services}}{{sub_service_name}}{{/each}} | {{/each}}
                                {{#if details.fuelCharges}}<br>Fuel Charges: {{details.fuelCharges}}{{/if}}
                                {{#if details.crewCharges}} | Crew Charges: {{details.crewCharges}}{{/if}}
                            </small>
                        </td>
                        <td style="text-align:center;">{{quantity}}</td>
                        <td style="text-align:right;">{{unit_price}}</td>
                        <td style="text-align:right;">{{total}}</td>
                    </tr>
                    {{/each}}
                    <tr class="total-row">
                        <td colspan="3" style="text-align:right;">SUBTOTAL</td>
                        <td style="text-align:right;">{{subtotal}}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align:right;">TAX ({{tax_rate}}%)</td>
                        <td style="text-align:right;">{{tax_amount}}</td>
                    </tr>
                    <tr class="total-row" style="color: #d32f2f; font-size: 13pt;">
                        <td colspan="3" style="text-align:right;">NET PAYABLE</td>
                        <td style="text-align:right;">{{currency}} {{final_amount}}</td>
                    </tr>
                </tbody>
            </table>

            <div class="details-box" style="font-size: 9pt;">
                <strong>Terms & Conditions:</strong><br>{{terms_conditions}}<br><br>
                <strong>Important Notes:</strong><br>{{notes}}
            </div>
        </body>
        </html>
        `;

        return handlebars.compile(templateHtml)(quoteData);
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












