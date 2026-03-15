// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';
// import fs from 'fs';
// import path from 'path';
// import { IInvoice } from '../interfaces/invoice.interface';

// const formatINR = (amount: number): string => {
//     return new Intl.NumberFormat('en-IN', {
//         style: 'decimal',
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2
//     }).format(amount);
// };

// function numberToINRWords(amount: number): string {
//     const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
//     const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
//     const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

//     function convert(n: number): string {
//         if (n < 10) return units[n];
//         if (n < 20) return teens[n - 10];
//         if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
//         if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
//         if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
//         if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
//         return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
//     }

//     const result = convert(Math.floor(amount));
//     return result ? result + ' Only' : 'Zero Only';
// }

// export const pdfService = {
//     async generateInvoiceHTML(invoice: IInvoice): Promise<string> {
//         const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
//         let base64Logo = '';
        
//         try {
//             const bitmap = fs.readFileSync(logoPath);
//             base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
//         } catch (err) {
//             console.error("Logo not found at:", logoPath);
//         }

//         const templateHtml = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//             <style>
//                 body { font-family: 'Arial', sans-serif; color: #1a1a1a; margin: 0; padding: 20px; font-size: 10pt; line-height: 1.2; position: relative; min-height: 100vh; }
//                 .main-table { width: 100%; border: 1.5px solid #000; border-collapse: collapse; table-layout: fixed; }
//                 .main-table td { border: 1px solid #000; padding: 8px; vertical-align: top; }
                
//                 .header-row td { border-bottom: 2px solid #000; }
//                 .company-logo { width: 40%; text-align: left; vertical-align: middle; }
//                 .company-info-text { width: 60%; text-align: right; }
//                 .company-info-text strong { font-size: 1.4em; color: #d32f2f; }

//                 .recipient-box { padding: 5px; height: 100px; position: relative; }
//                 .original-badge { position: absolute; right: 5px; top: 5px; font-size: 0.7em; border: 1px solid #000; padding: 2px; }

//                 .meta-data-row td { border-bottom: 1.5px solid #000; }
//                 .label { font-weight: bold; width: 110px; display: inline-block; }
                
//                 .line-item-table { width: 100%; border-collapse: collapse; margin-top: -1.5px; }
//                 .line-item-table th, .line-item-table td { border: 1.5px solid #000; padding: 6px; text-align: right; }
//                 .line-item-table th { background: #f5f5f5; text-align: center; font-weight: bold; }
//                 .col-desc { text-align: left !important; width: 55%; }

//                 .total-section td { border: none !important; padding: 2px 8px; }
//                 .words-row { border-top: 1.5px solid #000 !important; border-bottom: 1.5px solid #000 !important; font-weight: bold; }
                
//                 /* Footer Sections */
//                 .signature-section { text-align: right; margin-top: 40px; margin-bottom: 30px; }
//                 .terms-container { border-top: 1.5px solid #000; padding-top: 5px; font-size: 8.5pt; color: #000; }
//                 .terms-title { text-decoration: underline; font-weight: bold; margin-bottom: 5px; }
//                 .terms-list { list-style: none; padding: 0; margin: 0; }
//                 .terms-list li { margin-bottom: 2px; line-height: 1.3; }
//                 .red-text { color: #d32f2f; }
//                 .footer-notice { text-align: center; color: #d32f2f; font-style: italic; font-weight: bold; margin-top: 15px; font-size: 9pt; }
//             </style>
//         </head>
//         <body>
//             <table class="main-table">
//                 <tr class="header-row">
//                     <td class="company-logo">
//                         <img src="${base64Logo}" style="max-height: 70px;"/>
//                     </td>
//                     <td class="company-info-text">
//                         <strong>KLAR TRAVEL</strong><br>
//                         H.No 8-3-949/4 & 5, Madhu's House,<br>
//                         Ameerpet, Panjagutta, Hyderabad - 500073<br>
//                         Email: info@klartravel.com | Tel: +91 4023745112<br>
//                         <strong>GSTIN : 36BGCPXXXXXXXXX</strong>
//                     </td>
//                 </tr>
//                 <tr>
//                     <td colspan="2" class="recipient-box">
//                         <span class="original-badge">[Original for Recipient]</span>
//                         <strong>{{client_name}}</strong><br>
//                         {{billing_address}}<br>
//                         Mobile: {{client_phone}}<br>
//                         Email: {{client_email}}
//                     </td>
//                 </tr>
//                 <tr style="text-align: center; background: #eee;">
//                     <td colspan="2"><strong>TAX INVOICE ({{status}})</strong></td>
//                 </tr>
//                 <tr class="meta-data-row">
//                     <td>
//                         <span class="label">Invoice No :</span> {{invoice_number}}<br>
//                         <span class="label">Reference :</span> {{quote_reference}}<br>
//                         <span class="label">Mobile No :</span> {{client_phone}}
//                     </td>
//                     <td>
//                         <span class="label">Invoice Date:</span> {{created_at}}<br>
//                         <span class="label">Due Date :</span> {{due_date}}<br>
//                         <span class="label">Payment :</span> {{payment_method}}
//                     </td>
//                 </tr>
//             </table>

//             <table class="line-item-table">
//                 <thead>
//                     <tr>
//                         <th class="col-desc">SAC / Service Details</th>
//                         <th>Basic Fare</th>
//                         <th>Taxes</th>
//                         <th>Net Amount</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {{#each line_items}}
//                     <tr>
//                         <td class="col-desc">
//                             <strong>{{this.description}}</strong><br/>
//                             PASSENGER: {{this.passenger_name}}<br/>
//                             HOTEL: {{this.hotel_name}} | TYPE: {{this.service_type}}<br/>
//                             CHECKIN: {{this.checkin}} | NIGHTS: {{this.nights}}
//                         </td>
//                         <td>{{this.basic_fare_formatted}}</td>
//                         <td>{{this.tax_amount_formatted}}</td>
//                         <td>{{this.total_formatted}}</td>
//                     </tr>
//                     {{/each}}
                    
//                     <tr class="total-section">
//                         <td colspan="3" style="text-align: right;">Basic Sum (Subtotal):</td>
//                         <td>{{subtotal_formatted}}</td>
//                     </tr>
//                     <tr class="total-section">
//                         <td colspan="3" style="text-align: right;">Taxes (GST):</td>
//                         <td>{{tax_amount_formatted}}</td>
//                     </tr>
//                     <tr class="words-row">
//                         <td class="col-desc">INR {{total_words}}</td>
//                         <td colspan="2" style="text-align: right;">Total :</td>
//                         <td>INR {{total_formatted}}</td>
//                     </tr>
//                 </tbody>
//             </table>

//             <div class="signature-section">
//                 <p>For <strong>KLAR TRAVEL</strong></p>
//             </div>

//             <div class="terms-container">
//                 <div class="terms-title">Terms and Conditions E. & O.E</div>
//                 <ul class="terms-list red-text">
//                     <li>1. NOTE: COMPUTER GENERATED INVOICE SIGNATURE NOT REQUIRED</li>
//                     <li>2. All cheques / demand drafts in payment of bills must be crossed 'A/c Payee Only' and drawn in favour of KLAR TRAVEL</li>
//                     <li>3. Interest @ 24% per annum will be charged on all outstanding bills after due date.</li>
//                     <li>4. Bank Details : ICICI BANK CURRENT A/C : 020205500003, PUNJAGUTTA BRANCH, IFSC : ICIC0000202</li>
//                     <li>5. Subject To HYDERABAD Jurisdiction</li>
//                 </ul>
                
//                 <div class="footer-notice">
//                     (This is computer generated document. Signature not required)
//                 </div>
//             </div>
//         </body>
//         </html>
//         `;

//         const template = handlebars.compile(templateHtml);
        
//         return template({
//             ...invoice,
//             status: (invoice.status || 'draft').toUpperCase(),
//             created_at: new Date(invoice.created_at).toLocaleDateString('en-IN'),
//             due_date: new Date(invoice.due_date).toLocaleDateString('en-IN'),
//             total_words: numberToINRWords(invoice.total),
//             subtotal_formatted: formatINR(invoice.subtotal),
//             tax_amount_formatted: formatINR(invoice.tax_amount),
//             total_formatted: formatINR(invoice.total),
//             line_items: invoice.line_items.map(item => ({
//                 ...item,
//                 passenger_name: (item as any).passenger_name || 'N/A',
//                 hotel_name: (item as any).hotel_name || 'N/A',
//                 service_type: (item as any).service_type || 'Service',
//                 checkin: (item as any).checkin || 'N/A',
//                 nights: (item as any).nights || 0,
//                 basic_fare_formatted: formatINR(item.unitPrice * item.quantity),
//                 tax_amount_formatted: formatINR((item.unitPrice * item.quantity * item.taxRate) / 100),
//                 total_formatted: formatINR(item.total)
//             }))
//         });
//     },

//     async generatePDF(html: string): Promise<Buffer> {
//         const browser = await puppeteer.launch({ 
//             headless: 'new',
//             args: ['--no-sandbox', '--disable-setuid-sandbox'] 
//         });
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

const formatINR = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

function numberToINRWords(amount: number): string {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convert(n: number): string {
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
        if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
    }

    const result = convert(Math.round(amount));
    return result ? result + ' Only' : 'Zero Only';
}

export const pdfService = {
    async generateInvoiceHTML(invoice: any): Promise<string> {
        // Logo Implementation
        const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
        let base64Logo = '';
        try {
            const bitmap = fs.readFileSync(logoPath);
            base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
        } catch (err) {
            console.error("Logo not found at:", logoPath);
        }

        const templateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 20px; font-size: 10pt; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .company-info h1 { margin: 0; color: #d32f2f; font-size: 20pt; }
                
                /* Client Info Section styling based on your reference image */
                .section-container { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 20px; background-color: #fafafa; }
                .section-header { color: #4b0082; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
                .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .label { color: #666; font-size: 9pt; }
                .value { font-weight: bold; font-size: 10pt; display: block; margin-bottom: 5px; }

                /* Payment Details Section */
                .payment-container { border: 1px solid #ffe0b2; border-radius: 8px; padding: 15px; margin-bottom: 20px; background-color: #fffaf0; }
                .payment-header { color: #8d3a00; font-weight: bold; margin-bottom: 10px; }
                .paid-amount { color: #2e7d32; font-weight: bold; }
                .rest-amount { font-weight: bold; }
                .grand-total { color: #e65100; font-size: 14pt; font-weight: bold; }

                /* Items Table */
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #f5f5f5; border: 1px solid #000; padding: 8px; text-align: left; }
                td { border: 1px solid #000; padding: 8px; }
                .text-right { text-align: right; }

                /* Footer and Terms */
                .footer { margin-top: 30px; border-top: 1px solid #000; padding-top: 10px; }
                .terms-text { color: #d32f2f; font-size: 8pt; list-style: none; padding: 0; }
                .signature-notice { text-align: center; color: #d32f2f; font-weight: bold; margin-top: 10px; font-style: italic; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${base64Logo}" style="max-height: 60px;" />
                <div class="company-info" style="text-align: right;">
                    <h1>KLAR TRAVELS</h1>
                    <p>H.No 8-3-949/4 & 5, Ameerpet, Hyderabad - 500073<br>
                    GSTIN: {{gst_number}}</p>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div><strong>Invoice #:</strong> {{invoice_number}}</div>
                <div><strong>Date:</strong> {{created_at}}</div>
            </div>

            <div class="section-container">
                <div class="section-header">🏢 Client Information</div>
                <div class="grid-container">
                    <div>
                        <span class="label">Full Name:</span>
                        <span class="value">{{client_name}}</span>
                        <span class="label">Email Address:</span>
                        <span class="value">{{client_email}}</span>
                        <span class="label">Phone Number:</span>
                        <span class="value">{{client_phone}}</span>
                    </div>
                    <div>
                        <span class="label">Billing Address:</span>
                        <span class="value">{{billing_address}}</span>
                        <span class="label">GST Number:</span>
                        <span class="value">{{gst_number}}</span>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each line_items}}
                    <tr>
                        <td>{{this.description}}</td>
                        <td class="text-right">{{this.quantity}}</td>
                        <td class="text-right">{{this.unitPrice}}</td>
                        <td class="text-right">{{this.total}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>

            <div class="payment-container">
                <div class="payment-header">💳 Payment Details</div>
                <div class="grid-container">
                    <div>
                        <span class="label">Currency:</span> <span class="value">{{currency}}</span>
                        <span class="label">Subtotal:</span> <span class="value">₹{{subtotal_formatted}}</span>
                        <span class="label">Total:</span> <span class="grand-total">₹{{total_formatted}}</span>
                    </div>
                    <div>
                        <span class="label">Payment Method:</span> <span class="value">{{payment_method}}</span>
                        <span class="label">Payment Type:</span> <span class="value">{{payment_type}}</span>
                        <span class="label">Paid Amount ({{paid_percentage}}%):</span> <span class="paid-amount">₹{{paid_amount_formatted}}</span>
                        <span class="label">Rest Amount:</span> <span class="rest-amount">₹{{rest_amount_formatted}}</span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 20px;"><strong>Amount in Words:</strong> {{currency}} {{total_words}}</div>

            <div class="footer">
                <div style="font-weight: bold; text-decoration: underline;">Terms & Conditions E. & O.E:</div>
                <ul class="terms-text">
                    <li>1. NOTE: COMPUTER GENERATED INVOICE SIGNATURE NOT REQUIRED</li>
                    <li>2. All cheques / drafts must be drawn in favour of PRAVEEN TOURS & TRAVELS</li>
                    <li>3. Interest @ 24% per annum will be charged after due date.</li>
                    <li>4. Bank Details: ICICI BANK A/C: 020205500003, IFSC: ICIC0000202</li>
                </ul>
                <div class="signature-notice">(This is computer generated document. Signature not required)</div>
            </div>
        </body>
        </html>
        `;

        const template = handlebars.compile(templateHtml);
        return template({
            ...invoice,
            created_at: new Date(invoice.created_at).toLocaleDateString('en-IN'),
            total_words: numberToINRWords(invoice.total),
            subtotal_formatted: formatINR(invoice.subtotal),
            total_formatted: formatINR(invoice.total),
            paid_amount_formatted: formatINR(invoice.paid_amount),
            rest_amount_formatted: formatINR(invoice.rest_amount)
        });
    },

    // Fixed: Re-added the generatePDF function
    async generatePDF(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();
        return Buffer.from(pdf);
    }
};








