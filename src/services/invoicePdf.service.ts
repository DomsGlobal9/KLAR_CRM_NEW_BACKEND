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
        console.log("35 invoicePdf.service.ts - generateInvoiceHTML - invoice data:", JSON.stringify(invoice));
        
        const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
        let base64Logo = '';
        try {
            const bitmap = fs.readFileSync(logoPath);
            base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
        } catch (err) {
            console.error("Logo not found at:", logoPath);
        }

        // Custom helper for uppercase transformations
        if (!handlebars.helpers['uppercase']) {
            handlebars.registerHelper('uppercase', (str) => {
                return typeof str === 'string' ? str.toUpperCase() : '';
            });
        }

        // Contextual styling for status values
        let statusColor = '#e67e22'; 
        let statusBg = '#fdf2e9';
        if (invoice.status === 'paid') {
            statusColor = '#27ae60';
            statusBg = '#ebf5fb';
        } else if (invoice.status === 'due' || invoice.status === 'unpaid') {
            statusColor = '#c0392b';
            statusBg = '#fdedad';
        }

        let processedLineItems = invoice.line_items || [];
        if (processedLineItems.length === 0) {
            processedLineItems = [{
                description: `Travel Services Arrangement (Ref: ${invoice.quote_number || 'Booking'})`,
                quantity: 1,
                unitPrice: formatINR(invoice.subtotal),
                total: formatINR(invoice.subtotal)
            }];
        } else {
            processedLineItems = processedLineItems.map((item: any) => ({
                ...item,
                unitPrice: typeof item.unitPrice === 'number' ? formatINR(item.unitPrice) : item.unitPrice,
                total: typeof item.total === 'number' ? formatINR(item.total) : item.total
            }));
        }

        const templateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { margin: 15mm; }
                body { 
                    font-family: 'Segoe UI', 'Trebuchet MS', Arial, sans-serif; 
                    color: #2c3e50; 
                    margin: 0; 
                    padding: 0; 
                    line-height: 1.5; 
                    font-size: 10.5pt; 
                }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; margin-bottom: 20px; }
                .company-info h1 { margin: 0 0 4px 0; color: #4b0082; font-size: 19pt; font-weight: 800; letter-spacing: 0.5px; }
                .company-info p { margin: 0; color: #444; font-size: 9.5pt; line-height: 1.4; }
                
                /* Redesigned Clean Metadata Section Grid Layout */
                .invoice-meta-container {
                    display: grid;
                    grid-template-columns: 1.1fr 0.9fr;
                    gap: 15px;
                    margin-bottom: 22px;
                    background: #fff;
                }
                .meta-column-left { line-height: 1.7; }
                .meta-column-right { text-align: right; line-height: 1.7; }
                
                /* Formatted inline block payment status badge */
                .status-wrapper {
                    display: inline-flex;
                    align-items: center;
                    font-weight: 700;
                    color: #2c3e50;
                    font-size: 10.5pt;
                }
                .status-badge {
                    background-color: ${statusBg};
                    color: ${statusColor};
                    padding: 3px 10px;
                    border-radius: 4px;
                    border: 1px solid ${statusColor};
                    font-size: 9.5pt;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    margin-left: 6px;
                }

                /* Structured Informational Containers */
                .section-container { border: 1px solid #b0b0b0; border-radius: 4px; padding: 14px; margin-bottom: 20px; background-color: #fdfdfd; }
                .section-header { color: #4b0082; font-weight: bold; font-size: 11.5pt; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; }
                .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                
                .label { color: #555; font-size: 10pt; font-weight: 600; display: inline-block; width: 115px; }
                .value { font-weight: 500; font-size: 10.5pt; color: #111; }
                .grid-row { margin-bottom: 6px; }
                .grid-row:last-child { margin-bottom: 0; }

                /* Payment Details Highlight Container */
                .payment-container { border: 1px solid #ffe0b2; border-radius: 4px; padding: 14px; margin-bottom: 20px; background-color: #fffaf2; }
                .payment-header { color: #8d3a00; font-weight: bold; font-size: 11.5pt; margin-bottom: 12px; border-bottom: 1px solid #ffd19a; padding-bottom: 6px; }
                .paid-amount { color: #2e7d32; font-weight: bold; }
                .rest-amount { color: #c0392b; font-weight: bold; }
                .grand-total { color: #e65100; font-size: 14pt; font-weight: bold; }

                /* Structured Grid Table Layout */
                table { width: 100%; border-collapse: collapse; margin: 15px 0 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                th { background: #4b0082; color: white; border: 1px solid #9c7bb5; padding: 12px 10px; text-align: left; font-size: 10.5pt; font-weight: bold; }
                td { border: 1px solid #b0b0b0; padding: 12px 10px; vertical-align: middle; font-size: 10pt; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }

                /* Terms Layout */
                .footer-terms { border: 1px solid #b0b0b0; border-radius: 4px; padding: 14px; background: #fff8f8; font-size: 9.5pt; white-space: pre-line; line-height: 1.6; color: #333; }
                .signature-notice { text-align: center; color: #d32f2f; font-weight: bold; margin-top: 30px; font-style: italic; font-size: 10pt; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${base64Logo}" style="max-height: 60px;" />
                <div class="company-info" style="text-align: right;">
                    <h1>KLAR TRAVELS</h1>
                    <p>H.No 8-3-949/4 & 5, Ameerpet, Hyderabad - 500073<br>
                    <strong>GSTIN: 36BGCPS2420P1Z4</strong></p>
                </div>
            </div>

            <div class="invoice-meta-container">
                <div class="meta-column-left">
                    <div><strong>Invoice #:</strong> <span style="color: #111; font-weight: 700;">{{invoice_number}}</span></div>
                    <div><strong>Quote Ref:</strong> <span style="color: #555; font-weight: 500;">{{quote_number}}</span></div>
                </div>
                <div class="meta-column-right">
                    <div><strong>Date:</strong> <span style="color: #111; font-weight: 500;">{{created_at}}</span></div>
                    <div class="status-wrapper">
                        <span>Payment Status:</span>
                        <span class="status-badge">{{uppercase status}}</span>
                    </div>
                </div>
            </div>

            <div class="section-container">
                <div class="section-header">📋 Client Information</div>
                <div class="grid-container">
                    <div>
                        <div class="grid-row"><span class="label">Full Name:</span><span class="value" style="font-weight: bold;">{{client_name}}</span></div>
                        <div class="grid-row"><span class="label">Email Address:</span><span class="value">{{client_email}}</span></div>
                        <div class="grid-row"><span class="label">Phone Number:</span><span class="value">{{client_phone}}</span></div>
                    </div>
                    <div>
                        <div class="grid-row"><span class="label">Billing Address:</span><span class="value">{{billing_address}}</span></div>
                        <div class="grid-row"><span class="label">GST Number:</span><span class="value">{{#if gst_number}}{{gst_number}}{{else}}N/A{{/if}}</span></div>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description of Services</th>
                        <th class="text-center" style="width: 10%;">Qty</th>
                        <th class="text-right" style="width: 22%;">Unit Price</th>
                        <th class="text-right" style="width: 22%;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each processedLineItems}}
                    <tr>
                        <td style="font-weight: 600; color: #4b0082;">{{this.description}}</td>
                        <td class="text-center" style="font-weight: bold;">{{this.quantity}}</td>
                        <td class="text-right">₹{{this.unitPrice}}</td>
                        <td class="text-right" style="font-weight: bold;">₹{{this.total}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>

            <div class="payment-container">
                <div class="payment-header">💳 Financial Breakdowns</div>
                <div class="grid-container" style="grid-template-columns: 1fr 1.1fr;">
                    <div>
                        <div class="grid-row"><span class="label">Currency:</span> <span class="value" style="text-transform: uppercase;">{{currency}}</span></div>
                        <div class="grid-row"><span class="label">Subtotal:</span> <span class="value">₹{{subtotal_formatted}}</span></div>
                        <div class="grid-row" style="margin-top: 10px;"><span class="label" style="margin-top: 4px;">Total Amount:</span> <span class="grand-total">₹{{total_formatted}}</span></div>
                    </div>
                    <div>
                        <div class="grid-row"><span class="label">Payment Method:</span> <span class="value" style="text-transform: uppercase;">{{payment_method}}</span></div>
                        <div class="grid-row"><span class="label">Payment Type:</span> <span class="value" style="text-transform: capitalize;">{{payment_type}}</span></div>
                        <div class="grid-row"><span class="label">Paid Amount ({{paid_percentage}}%):</span> <span class="paid-amount">₹{{paid_amount_formatted}}</span></div>
                        <div class="grid-row"><span class="label">Remaining Balance:</span> <span class="rest-amount">₹{{rest_amount_formatted}}</span></div>
                    </div>
                </div>
            </div>

            <div class="section-container" style="background-color: #fff; border-style: dashed; padding: 12px 14px; font-size: 10.5pt;">
                <strong>Amount in Words:</strong> <span style="color: #4b0082; font-weight: 700; margin-left: 5px;">{{total_words}}</span>
            </div>

            <div class="footer-terms">
                <strong style="color: #d32f2f; font-size: 10pt; text-decoration: underline; display: block; margin-bottom: 6px;">Terms & Conditions:</strong>
                {{{terms_conditions}}}
            </div>

            <div class="signature-notice">
                (This is a computer-generated document. Signature not required)
                <br><small style="color:#777; font-weight: normal; font-size: 8.5pt; margin-top: 4px; display: inline-block;">Every journey begins with trust.</small>
            </div>
        </body>
        </html>
        `;

        const template = handlebars.compile(templateHtml);
        return template({
            ...invoice,
            processedLineItems,
            created_at: new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            total_words: numberToINRWords(invoice.total),
            subtotal_formatted: formatINR(invoice.subtotal),
            total_formatted: formatINR(invoice.total),
            paid_amount_formatted: formatINR(invoice.paid_amount),
            rest_amount_formatted: formatINR(invoice.rest_amount)
        });
    },

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