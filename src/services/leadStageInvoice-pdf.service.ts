import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

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

export const leadStageInvoicePdfService = {
    async generatePDFBuffer(invoice: any): Promise<Buffer> {
        const htmlContent = await this.compileInvoiceHTML(invoice);
        
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage', 
                '--disable-gpu',
                '--disable-accelerated-2d-canvas'
            ]
        });
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' as any });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
        });

        await browser.close();
        return Buffer.from(pdfBuffer);
    },

    async compileInvoiceHTML(invoice: any): Promise<string> {
        // Register helpers
        if (!handlebars.helpers['uppercase']) {
            handlebars.registerHelper('uppercase', (str) => {
                return typeof str === 'string' ? str.toUpperCase() : '';
            });
        }
        
        if (!handlebars.helpers.eq) {
            handlebars.registerHelper('eq', (a: any, b: any) => a === b);
        }
        
        if (!handlebars.helpers.formatDate) {
            handlebars.registerHelper('formatDate', (dateStr: string) => {
                if (!dateStr) return 'N/A';
                return new Date(dateStr).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            });
        }

        // Process service configurations from the service_configurations array
        let processedServices: any[] = [];
        let totalAmount = 0;

        if (invoice.service_configurations && Array.isArray(invoice.service_configurations)) {
            invoice.service_configurations.forEach((service: any) => {
                const configs = service.configurations || {};
                
                // Format configurations for display
                const formattedConfigs: any = {};
                let price = 0;
                
                // Extract price if available
                if (configs.price) {
                    price = parseFloat(configs.price);
                } else if (configs.charterBudget) {
                    price = parseFloat(configs.charterBudget);
                }
                
                // Format all configuration keys for display
                Object.keys(configs).forEach(key => {
                    // Skip price as we'll show it separately in the total column
                    if (key === 'price' || key === 'charterBudget') {
                        formattedConfigs['Price'] = `₹${formatINR(price)}`;
                        return;
                    }
                    
                    // Format the key for display (capitalize, add spaces)
                    const displayKey = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (str) => str.toUpperCase());
                    
                    let value = configs[key];
                    
                    // Format specific fields
                    if (key === 'pickupTime' || key === 'charterDate') {
                        value = new Date(value).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        });
                    }
                    
                    formattedConfigs[displayKey] = value || 'N/A';
                });
                
                // Ensure Price is included
                if (!formattedConfigs['Price']) {
                    formattedConfigs['Price'] = `₹${formatINR(price)}`;
                }
                
                processedServices.push({
                    serviceName: service.serviceName || 'Service',
                    configuredAt: service.configuredAt || new Date().toISOString(),
                    configurations: formattedConfigs
                });
                
                totalAmount += price;
            });
        }

        const paidAmount = invoice.paid_amount || 0;
        const restAmount = totalAmount - paidAmount;

        // Determine status
        let status = invoice.status || 'sent';
        let statusColor = '#e67e22';
        let statusBg = '#fdf2e9';
        if (status === 'paid') {
            statusColor = '#27ae60';
            statusBg = '#e8f8f5';
        } else if (status === 'due' || status === 'unpaid') {
            statusColor = '#c0392b';
            statusBg = '#fdedad';
        }

        const logoUrl = 'https://travel-pdfs-prod-399934155938-eu-north-1-an.s3.eu-north-1.amazonaws.com/pdf/Frame%201000007152%202.png';

        // Complete HTML template
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
                    line-height: 1.6; 
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
                
                /* Header Table */
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
                
                /* Invoice Meta Container - Fixed Alignment */
                .invoice-meta-container {
                    display: table;
                    width: 100%;
                    margin-bottom: 35px;
                    background: #fafafa;
                    border-radius: 10px;
                    border: 1px solid #e8e8e8;
                }
                
                .meta-row {
                    display: table-row;
                }
                
                .meta-column-left, .meta-column-right {
                    display: table-cell;
                    padding: 18px 22px;
                    vertical-align: top;
                    width: 50%;
                }
                
                .meta-column-left {
                    border-right: 1px solid #e8e8e8;
                }
                
                .meta-column-left div, .meta-column-right div {
                    margin-bottom: 8px;
                    line-height: 1.8;
                }
                
                .meta-column-left strong, .meta-column-right strong {
                    color: #4b0082;
                    min-width: 140px;
                    display: inline-block;
                    font-weight: 700;
                }
                
                .meta-column-right {
                    text-align: left;
                }
                
                .meta-column-right .status-wrapper {
                    display: flex;
                    align-items: center;
                    margin-top: 8px;
                }
                
                .meta-column-right .status-wrapper strong {
                    min-width: 60px;
                }
                
                /* Status badge */
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
                    display: inline-block;
                }

                /* Section Containers */
                .section-container { 
                    border: 1px solid #e8e8e8; 
                    border-radius: 12px; 
                    padding: 22px 25px; 
                    margin-bottom: 28px; 
                    background-color: #fbfbfb;
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
                
                /* Service Configurations Container */
                .config-container {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 10px;
                    border-left: 4px solid #4b0082;
                }
                
                .config-row {
                    display: flex;
                    padding: 6px 0;
                    border-bottom: 1px solid #e8e8e8;
                }
                
                .config-row:last-child {
                    border-bottom: none;
                }
                
                .config-key {
                    font-weight: 600;
                    color: #4b0082;
                    min-width: 150px;
                    font-size: 9.5pt;
                }
                
                .config-value {
                    color: #333;
                    font-size: 9.5pt;
                }
                
                /* Grid Container for Payment */
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
                
                .invoice-table tr:last-child td {
                    border-bottom: none;
                }
                
                .text-right { 
                    text-align: right; 
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
                
                /* Service specific styling */
                .service-tag {
                    display: inline-block;
                    background: #4b0082;
                    color: white;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 8pt;
                    font-weight: 600;
                    margin-right: 8px;
                }
                
                .service-item {
                    margin-bottom: 20px; 
                    border: 1px solid #e8e8e8; 
                    border-radius: 8px; 
                    padding: 15px; 
                    background: white;
                }
                
                .service-header {
                    display: flex; 
                    align-items: center; 
                    margin-bottom: 12px;
                }
                
                .service-configured {
                    font-size: 9pt; 
                    color: #888; 
                    margin-left: 10px;
                }
                
                /* Responsive adjustments */
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
                    
                    .meta-column-left, .meta-column-right {
                        display: block !important;
                        width: 100% !important;
                        border-right: none !important;
                        padding: 15px !important;
                    }
                    
                    .meta-column-left {
                        border-bottom: 1px solid #e8e8e8;
                    }
                    
                    .meta-column-right {
                        text-align: left !important;
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
                    
                    .config-row {
                        flex-direction: column;
                        padding: 8px 0;
                    }
                    
                    .config-key {
                        min-width: auto;
                    }
                    
                    .meta-column-right .status-wrapper {
                        flex-wrap: wrap;
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
                                <img src="${logoUrl}" alt="KLAR TRAVELS" />
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
                        <div class="meta-row">
                            <div class="meta-column-left">
                                <div><strong>Invoice Number:</strong> {{invoice_number}}</div>
                                <div><strong>Lead Reference:</strong> {{lead_reference}}</div>
                                <div><strong>Generated Date:</strong> {{generated_date}}</div>
                                <div><strong>Billing Address:</strong> {{billing_address}}</div>
                            </div>
                            <div class="meta-column-right">
                                <div><strong>Client:</strong> {{lead_name}}</div>
                                <div><strong>Email:</strong> {{lead_email}}</div>
                                <div><strong>Phone:</strong> {{lead_phone}}</div>
                                <div class="status-wrapper">
                                    <strong>Status:</strong>
                                    <span class="status-badge">{{uppercase status}}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section-container">
                        <div class="section-header">
                            <span>✈️</span> Service Specifications
                        </div>
                        
                        {{#each processedServices}}
                        <div class="service-item">
                            <div class="service-header">
                                <span class="service-tag">{{uppercase serviceName}}</span>
                                <span class="service-configured">Configured: {{formatDate configuredAt}}</span>
                            </div>
                            <div class="config-container">
                                {{#each configurations}}
                                <div class="config-row">
                                    <span class="config-key">{{@key}}:</span>
                                    <span class="config-value">{{this}}</span>
                                </div>
                                {{/each}}
                            </div>
                        </div>
                        {{/each}}
                    </div>

                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>Service Component</th>
                                <th class="text-right" style="width: 25%;">Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{#each processedServices}}
                            <tr>
                                <td style="font-weight: 500;">{{serviceName}}</td>
                                <td class="text-right" style="font-weight: 600;">{{configurations.Price}}</td>
                            </tr>
                            {{/each}}
                        </tbody>
                    </table>

                    <div class="payment-container">
                        <div class="payment-header">
                            <span>💳</span> Financial Breakdown
                        </div>
                        <div class="grid-container">
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
                                {{#if gst_number}}
                                <div class="info-row">
                                    <span class="label">GST Number:</span>
                                    <span class="value">{{gst_number}}</span>
                                </div>
                                {{/if}}
                            </div>
                            <div>
                                <div class="info-row">
                                    <span class="label" style="font-size: 12pt; font-weight: bold;">Total Amount:</span>
                                    <span class="grand-total">₹{{total_formatted}}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Paid Amount:</span>
                                    <span class="paid-amount">₹{{paid_amount_formatted}}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Balance Due:</span>
                                    <span class="rest-amount">₹{{rest_amount_formatted}}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">Paid Percentage:</span>
                                    <span class="value">{{paid_percentage}}%</span>
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
                        {{#if notes}}
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e8e8e8;">
                            <strong>Notes:</strong> {{notes}}
                        </div>
                        {{/if}}
                    </div>

                    <div class="signature-notice">
                        ⚡ This is a system-generated requirements confirmation document.
                        <br><small style="color:#888; font-weight: normal; font-size: 8.5pt; margin-top: 8px; display: inline-block;">✨ Thank you for coordinating with KLAR Travels. ✨</small>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        const template = handlebars.compile(templateHtml);
        
        // Prepare data for template
        const templateData = {
            ...invoice,
            processedServices,
            invoice_number: invoice.invoice_number || 'N/A',
            lead_reference: invoice.lead_id || 'N/A',
            lead_name: invoice.lead_name || 'N/A',
            lead_email: invoice.lead_email || 'N/A',
            lead_phone: invoice.lead_phone || 'N/A',
            billing_address: invoice.billing_address || 'N/A',
            gst_number: invoice.gst_number || '',
            generated_date: invoice.invoice_date ? 
                new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 
                new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            total_formatted: formatINR(totalAmount),
            paid_amount_formatted: formatINR(paidAmount),
            rest_amount_formatted: formatINR(restAmount),
            total_words: numberToINRWords(totalAmount),
            currency: invoice.currency || 'INR',
            payment_type: invoice.payment_type || 'full',
            payment_method: invoice.payment_method || 'online',
            paid_percentage: invoice.paid_percentage || 0,
            terms_conditions: invoice.terms_conditions || `1. All services are subject to availability and confirmation.\n2. Cancellation charges may apply as per company policy.\n3. Rates are subject to change without prior notice.\n4. Payment must be cleared before service delivery.\n5. Any disputes are subject to Hyderabad jurisdiction.`,
            notes: invoice.notes || ''
        };

        return template(templateData);
    }
};

export default leadStageInvoicePdfService;