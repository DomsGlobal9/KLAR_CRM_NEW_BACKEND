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
    async generateInvoiceHTML(invoice: any, forEmail: boolean = false): Promise<string> {
        const logoUrl = 'https://travel-pdfs-prod-399934155938-eu-north-1-an.s3.eu-north-1.amazonaws.com/pdf/Frame 1000007152 2.png';

        let logoSrc = '';
        if (forEmail) {
            logoSrc = logoUrl;
        } else {
            logoSrc = logoUrl;
        }

        if (!handlebars.helpers['uppercase']) {
            handlebars.registerHelper('uppercase', (str) => {
                return typeof str === 'string' ? str.toUpperCase() : '';
            });
        }

        let statusColor = '#e67e22';
        let statusBg = '#fdf2e9';
        if (invoice.status === 'paid') {
            statusColor = '#27ae60';
            statusBg = '#e8f8f5';
        } else if (invoice.status === 'due' || invoice.status === 'unpaid') {
            statusColor = '#c0392b';
            statusBg = '#fdedad';
        } else if (invoice.status === 'draft') {
            statusColor = '#7f8c8d';
            statusBg = '#ecf0f1';
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
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                /* Reset and base styles */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body { 
                    font-family: 'Segoe UI', 'Trebuchet MS', Arial, sans-serif; 
                    background-color: #f0f2f5;
                    margin: 0;
                    padding: 30px 0;
                    line-height: 1.5; 
                }
                
                /* Main container with center alignment */
                .invoice-container {
                    max-width: 1000px;
                    width: 100%;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }
                
                /* Inner content wrapper */
                .invoice-content {
                    padding: 40px 45px;
                    background: #fff;
                }
                
                /* Bulletproof Table structure for Email/PDF Header layout alignment */
                .header-table {
                    width: 100%;
                    border-collapse: collapse;
                    border-spacing: 0;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #d32f2f;
                }
                
                .header-table td {
                    padding-bottom: 25px;
                    vertical-align: top;
                }
                
                .logo-container {
                    text-align: left;
                }
                
                .logo-container img {
                    max-height: 80px;
                    width: auto;
                    display: block;
                }
                
                .company-info {
                    text-align: right;
                }
                
                .company-name {
                    font-size: 28px;
                    font-weight: 800;
                    color: #4b0082;
                    margin-bottom: 12px;
                    letter-spacing: 1px;
                }
                
                .company-address {
                    color: #555;
                    font-size: 10pt;
                    line-height: 1.5;
                    margin-bottom: 8px;
                }
                
                .company-gst {
                    font-weight: 600;
                    color: #4b0082;
                    font-size: 10pt;
                    margin-top: 5px;
                }
                
                /* Invoice Meta Container */
                .invoice-meta-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 35px;
                    padding: 20px 0;
                    border-bottom: 2px solid #f0f0f0;
                    flex-wrap: wrap;
                    gap: 25px;
                    background: #fafafa;
                    border-radius: 10px;
                    padding: 18px 22px;
                }
                
                .meta-column-left, .meta-column-right {
                    line-height: 2;
                }
                
                .meta-column-left div, .meta-column-right div {
                    margin-bottom: 8px;
                }
                
                .meta-column-left strong, .meta-column-right strong {
                    color: #4b0082;
                    min-width: 130px;
                    display: inline-block;
                    font-weight: 700;
                }
                
                .meta-column-right {
                    text-align: right;
                }
                
                /* Status badge */
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
                    padding: 5px 15px;
                    border-radius: 25px;
                    border: 1px solid ${statusColor};
                    font-size: 10pt;
                    font-weight: 800;
                    letter-spacing: 0.5px;
                    margin-left: 12px;
                }

                /* Section Containers */
                .section-container { 
                    border: 1px solid #e8e8e8; 
                    border-radius: 12px; 
                    padding: 22px 25px; 
                    margin-bottom: 28px; 
                    background-color: #fbfbfb;
                    transition: all 0.3s ease;
                }
                
                .section-header { 
                    color: #4b0082; 
                    font-weight: bold; 
                    font-size: 13pt; 
                    margin-bottom: 18px; 
                    display: flex; 
                    align-items: center; 
                    gap: 10px; 
                    border-bottom: 2px solid #4b0082; 
                    padding-bottom: 10px; 
                }
                
                .section-header span {
                    font-size: 16pt;
                }
                
                .grid-container { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 20px; 
                }
                
                .info-row {
                    display: flex;
                    align-items: baseline;
                    flex-wrap: wrap;
                    margin-bottom: 14px;
                    padding: 4px 0;
                }
                
                .label { 
                    color: #666; 
                    font-size: 10.5pt; 
                    font-weight: 600; 
                    min-width: 120px;
                    display: inline-block;
                }
                
                .value { 
                    font-weight: 500; 
                    font-size: 10.5pt; 
                    color: #222;
                    flex: 1;
                }
                
                /* Payment Container */
                .payment-container { 
                    border: 1px solid #ffe0b2; 
                    border-radius: 12px; 
                    padding: 22px 25px; 
                    margin-bottom: 28px; 
                    background: linear-gradient(135deg, #fffaf2 0%, #fff5e6 100%);
                }
                
                .payment-header { 
                    color: #e65100; 
                    font-weight: bold; 
                    font-size: 13pt; 
                    margin-bottom: 18px; 
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border-bottom: 2px solid #ffd19a; 
                    padding-bottom: 10px; 
                }
                
                .payment-header span {
                    font-size: 16pt;
                }
                
                .paid-amount { 
                    color: #2e7d32; 
                    font-weight: bold; 
                    font-size: 11pt;
                }
                
                .rest-amount { 
                    color: #c0392b; 
                    font-weight: bold; 
                    font-size: 11pt;
                }
                
                .grand-total { 
                    color: #e65100; 
                    font-size: 18pt; 
                    font-weight: bold; 
                }

                /* Table Layout */
                .invoice-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 28px 0; 
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                
                .invoice-table th { 
                    background: linear-gradient(135deg, #4b0082 0%, #6a1b9a 100%);
                    color: white; 
                    padding: 15px 14px; 
                    text-align: left; 
                    font-size: 11pt; 
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                
                .invoice-table td { 
                    border-bottom: 1px solid #e8e8e8; 
                    padding: 14px; 
                    vertical-align: middle; 
                    font-size: 10.5pt; 
                    background-color: #fff;
                }
                
                .invoice-table tr:hover td {
                    background-color: #f9f9f9;
                }
                
                .text-right { 
                    text-align: right; 
                }
                
                .text-center { 
                    text-align: center; 
                }

                /* Terms Layout */
                .footer-terms { 
                    border: 1px solid #e8e8e8; 
                    border-radius: 12px; 
                    padding: 20px 25px; 
                    background: #fef9f9; 
                    font-size: 9.5pt; 
                    white-space: pre-line; 
                    line-height: 1.7; 
                    color: #444; 
                    margin-top: 28px;
                }
                
                .footer-terms strong {
                    color: #d32f2f;
                    font-size: 10.5pt;
                }
                
                .signature-notice { 
                    text-align: center; 
                    color: #d32f2f; 
                    font-weight: bold; 
                    margin-top: 35px; 
                    font-style: italic; 
                    font-size: 10pt; 
                    padding-top: 18px;
                    border-top: 1px solid #eee;
                }
                
                /* Amount in words section */
                .amount-words {
                    background: linear-gradient(135deg, #f0f4ff 0%, #e8edf5 100%);
                    border-radius: 10px;
                    padding: 14px 20px; 
                    margin: 22px 0;
                    font-size: 10.5pt;
                    border-left: 5px solid #4b0082;
                }
                
                /* Responsive adjustments for mobile and email */
                @media only screen and (max-width: 600px) {
                    .invoice-content {
                        padding: 20px;
                    }
                    
                    .header-table td {
                        display: block !important;
                        width: 100% !important;
                        text-align: center !important;
                        padding-bottom: 15px !important;
                    }
                    
                    .company-info {
                        text-align: center !important;
                    }
                    
                    .logo-container {
                        text-align: center !important;
                    }
                    
                    .logo-container img {
                        margin: 0 auto !important;
                    }
                    
                    .invoice-meta-container {
                        flex-direction: column;
                        padding: 15px;
                    }
                    
                    .meta-column-right {
                        text-align: left;
                    }
                    
                    .grid-container {
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }
                    
                    .info-row {
                        flex-direction: column;
                    }
                    
                    .label {
                        margin-bottom: 5px;
                        min-width: auto;
                    }
                    
                    .invoice-table th,
                    .invoice-table td {
                        padding: 10px 8px;
                    }
                    
                    .invoice-table {
                        display: block;
                        overflow-x: auto;
                    }
                    
                    .company-name {
                        font-size: 22px;
                    }
                }
                
                /* Print styles for PDF */
                @media print {
                    body {
                        background: white;
                        padding: 0;
                        margin: 0;
                    }
                    
                    .invoice-container {
                        max-width: 100%;
                        margin: 0;
                        box-shadow: none;
                    }
                    
                    .invoice-content {
                        padding: 25px;
                    }
                    
                    .section-container,
                    .payment-container,
                    .footer-terms {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    
                    .invoice-table tr:hover td {
                        background-color: white;
                    }
                    
                    .invoice-meta-container {
                        background: #fafafa;
                    }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="invoice-content">
                    
                    <table class="header-table">
                        <tr>
                            <td class="logo-container" style="width: 50%;">
                                ${logoSrc ? `<img src="${logoSrc}" alt="KLAR TRAVELS" />` : '<div class="company-name" style="font-size: 24px;">KLAR TRAVELS</div>'}
                            </td>
                            <td class="company-info" style="width: 50%;">
                                <div class="company-name">KLAR TRAVELS</div>
                                <div class="company-address">
                                    H.No 8-3-949/4 & 5, Ameerpet, Hyderabad - 500073
                                </div>
                                <div class="company-gst">
                                    <strong>GSTIN:</strong> 36BGCPS2420P1Z4
                                </div>
                            </td>
                        </tr>
                    </table>

                    <div class="invoice-meta-container">
                        <div class="meta-column-left">
                            <div><strong>Invoice Number:</strong> {{invoice_number}}</div>
                            <div><strong>Quote Reference:</strong> {{quote_number}}</div>
                        </div>
                        <div class="meta-column-right">
                            <div><strong>Issue Date:</strong> {{created_at}}</div>
                            <div class="status-wrapper">
                                <strong>Payment Status:</strong>
                                <span class="status-badge">{{uppercase status}}</span>
                            </div>
                        </div>
                    </div>

                    <div class="section-container">
                        <div class="section-header">
                            <span>📋</span> Client Information
                        </div>
                        <div class="grid-container">
                            <div>
                                <div class="info-row">
                                    <span class="label">Full Name:</span>
                                    <span class="value" style="font-weight: 600;">{{client_name}}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Email Address:</span>
                                    <span class="value">{{client_email}}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Phone Number:</span>
                                    <span class="value">{{client_phone}}</span>
                                </div>
                            </div>
                            <div>
                                <div class="info-row">
                                    <span class="label">Billing Address:</span>
                                    <span class="value">{{billing_address}}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">GST Number:</span>
                                    <span class="value">{{#if gst_number}}{{gst_number}}{{else}}N/A{{/if}}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>Description of Services</th>
                                <th class="text-center" style="width: 10%;">Qty</th>
                                <th class="text-right" style="width: 22%;">Unit Price (₹)</th>
                                <th class="text-right" style="width: 22%;">Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{#each processedLineItems}}
                            <tr>
                                <td style="font-weight: 500;">{{this.description}}</td>
                                <td class="text-center">{{this.quantity}}</td>
                                <td class="text-right">{{this.unitPrice}}</td>
                                <td class="text-right" style="font-weight: 600;">₹{{this.total}}</td>
                            </tr>
                            {{/each}}
                        </tbody>
                    </table>

                    <div class="payment-container">
                        <div class="payment-header">
                            <span>💳</span> Financial Breakdown
                        </div>
                        <div class="grid-container" style="grid-template-columns: 1fr 1fr;">
                            <div>
                                <div class="info-row">
                                    <span class="label">Currency:</span>
                                    <span class="value" style="text-transform: uppercase;">{{currency}}</span>
                                </div>
                                 <div class="info-row">
                                    <span class="label">Payment Type:</span>
                                    <span class="value" style="text-transform: capitalize;">{{payment_type}}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Payment Method:</span>
                                    <span class="value" style="text-transform: uppercase;">{{payment_method}}</span>
                                </div>
                            </div>
                            <hr />
                            <div>
                                <div class="info-row" style="margin-top: 10px;">
                                    <span class="label" style="font-size: 12pt; font-weight: bold;">Total Amount:</span>
                                    <span class="grand-total">₹{{total_formatted}}</span>
                                </div>
                                 <div class="info-row">
                                    <span class="label">Paid ({{paid_percentage}}%):</span>
                                    <span class="paid-amount">₹{{paid_amount_formatted}}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Balance Due:</span>
                                    <span class="rest-amount">₹{{rest_amount_formatted}}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="amount-words">
                        <strong>Amount in Words:</strong> 
                        <span style="color: #4b0082; font-weight: 600; margin-left: 10px;">{{total_words}}</span>
                    </div>

                    <div class="footer-terms">
                        <strong style="color: #d32f2f; font-size: 10.5pt; display: block; margin-bottom: 12px;">📜 Terms & Conditions:</strong>
                        {{{terms_conditions}}}
                    </div>

                    <div class="signature-notice">
                        ⚡ This is a computer-generated document. No signature required.
                        <br><small style="color:#888; font-weight: normal; font-size: 8.5pt; margin-top: 8px; display: inline-block;">✨ Every journey begins with trust. Thank you for choosing KLAR TRAVELS! ✨</small>
                    </div>
                </div>
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

    async generateEmailInvoiceHTML(invoice: any): Promise<string> {
        return this.generateInvoiceHTML(invoice, true);
    },

    // Method for generating PDF buffer directly from invoice data
    async generateInvoicePDF(invoice: any): Promise<Buffer> {
        const html = await this.generateInvoiceHTML(invoice, false);
        return this.generatePDF(html);
    },

    async generatePDF(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' as any });
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                bottom: '15mm',
                left: '15mm',
                right: '15mm'
            }
        });
        await browser.close();
        return Buffer.from(pdf);
    }
};