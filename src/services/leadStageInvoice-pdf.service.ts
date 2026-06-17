import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

export const leadStageInvoicePdfService = {
  /**
   * Compiles dynamic Handlebars template syntax into raw memory PDF buffers using Puppeteer
   */
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
    // Using type assertion to handle the networkidle0 constraint cleanly
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' as any });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  },

  /**
   * Houses the complete tax invoice structure markup matching Klar Travels specifications
   */
  async compileInvoiceHTML(invoice: any): Promise<string> {
    // Register utility helpers within the local compiler instance space safely
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

    const templateHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; background-color: #fff; color: #333; padding: 10px; font-size: 10pt; }
            .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 2px solid #0284c7; }
            .header-table td { padding-bottom: 15px; vertical-align: top; }
            .logo-text { font-size: 24pt; font-weight: bold; color: #0284c7; }
            .company-details { text-align: right; font-size: 9pt; color: #555; line-height: 1.4; }
            .doc-title { text-align: center; color: #0284c7; font-size: 20pt; margin: 15px 0; font-weight: bold; letter-spacing: 1px; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .meta-table td { border: 1px solid #e2e8f0; padding: 10px; width: 50%; vertical-align: top; }
            .section-title { background: #f1f5f9; padding: 6px 10px; font-weight: bold; color: #1e293b; margin-bottom: 10px; border-left: 4px solid #0284c7; text-transform: uppercase; }
            .item-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .item-table th { background: #0284c7; color: white; padding: 8px 10px; font-weight: bold; text-align: left; font-size: 9pt; }
            .item-table td { border: 1px solid #e2e8f0; padding: 10px; vertical-align: top; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .totals-box { width: 40%; float: right; margin-bottom: 20px; }
            .totals-table { width: 100%; border-collapse: collapse; }
            .totals-table td { padding: 6px 10px; border: 1px solid #e2e8f0; }
            .terms-box { width: 55%; float: left; font-size: 8pt; color: #555; line-height: 1.4; white-space: pre-line; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; }
            .footer-note { clear: both; text-align: center; font-size: 8pt; color: #94a3b8; padding-top: 30px; }
            .badge { display: inline-block; padding: 2px 8px; font-size: 8pt; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
            .badge-paid { background: #dcfce7; color: #15803d; }
            .badge-partial { background: #ffedd5; color: #c2410c; }
            .badge-sent { background: #dbeafe; color: #1d4ed8; }
        </style>
    </head>
    <body>
        <div class="container">
            <table class="header-table">
                <tr>
                    <td>
                        <div class="logo-text">KLAR TRAVELS</div>
                        <div style="font-size:9pt; color:#64748b; margin-top:2px;">Explore The Horizon</div>
                    </td>
                    <td class="company-details">
                        <div style="font-weight:bold; color:#0284c7; font-size:11pt; margin-bottom:2px;">KLAR TRAVELS PRIVATE LIMITED</div>
                        #8-3-949/4 & 5, MADHU'S HOUSE, PANJAGUTTA<br>
                        HYDERABAD, TELANGANA - 500073<br>
                        Mob: +918099359377 | Email: operations@klartravels.com<br>
                        <strong>GSTIN: 36BGCPS2420P1Z4</strong>
                    </td>
                </tr>
            </table>

            <div class="doc-title">TAX INVOICE</div>

            <table class="meta-table">
                <tr>
                    <td>
                        <strong style="color:#0284c7;">BILLED TO:</strong><br>
                        <span class="bold" style="font-size:11pt;">{{lead_name}}</span><br>
                        {{#if lead_email}}Email: {{lead_email}}<br>{{/if}}
                        {{#if lead_phone}}Phone: {{lead_phone}}<br>{{/if}}
                        <div style="margin-top:5px; white-space: pre-wrap;"><strong>Address:</strong><br>{{billing_address}}</div>
                        {{#if gst_number}}<div style="margin-top:4px;"><strong>Client GSTIN:</strong> {{gst_number}}</div>{{/if}}
                    </td>
                    <td>
                        <strong style="color:#0284c7;">INVOICE DETAILS:</strong><br>
                        <table style="width:100%; margin-top:5px;" class="totals-table">
                            <tr><td>Invoice No:</td><td class="bold">{{invoice_number}}</td></tr>
                            <tr><td>Invoice Date:</td><td>{{formatDate invoice_date}}</td></tr>
                            <tr><td>Payment Method:</td><td>{{payment_method}}</td></tr>
                            <tr><td>Currency:</td><td class="bold">{{currency}}</td></tr>
                            <tr><td>Status:</td><td><span class="badge badge-{{status}}">{{status}}</span></td></tr>
                        </table>
                    </td>
                </tr>
            </table>

            <div class="section-header">💼 ACCOMMODATIONS & SERVICE LINE ITEMS</div>
            <table class="item-table">
                <thead>
                    <tr>
                        <th style="width: 30%;">Service Component</th>
                        <th style="width: 50%;">Configuration Mapping Context Details</th>
                        <th style="width: 20%;" class="text-right">Total Cost</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each service_configurations}}
                    <tr>
                        <td class="bold" style="color:#0369a1;">{{serviceName}}</td>
                        <td>
                            <div style="font-size:8.5pt; color:#475569;">
                                Configured At: {{formatDate configuredAt}}
                            </div>
                            <div style="margin-top:5px; font-family:monospace; font-size:8.5pt; background:#f8fafc; padding:6px; border-radius:4px;">
                                {{#each configurations}}
                                <span style="text-transform: capitalize; font-weight:bold; color:#64748b;">{{@key}}:</span> {{this}}<br>
                                {{/each}}
                            </div>
                        </td>
                        <td class="text-right bold" style="vertical-align: middle;">{{../currency}} {{this.configurations.price}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>

            <div class="terms-box">
                <strong>Terms & Conditions:</strong><br>
                {{terms_conditions}}
                {{#if notes}}
                <div style="margin-top:8px; border-top:1px dashed #cbd5e1; padding-top:4px;">
                    <strong>Notes:</strong> {{notes}}
                </div>
                {{/if}}
            </div>

            <div class="totals-box">
                <table class="totals-table">
                    <tr>
                        <td>Gross Subtotal:</td>
                        <td class="text-right">{{currency}} {{total_amount}}</td>
                    </tr>
                    <tr>
                        <td style="color:#16a34a;" class="bold">Amount Paid:</td>
                        <td class="text-right bold" style="color:#16a34a;">{{currency}} {{paid_amount}}</td>
                    </tr>
                    <tr style="background:#fef2f2;">
                        <td style="color:#dc2626;" class="bold">Balance Outstanding:</td>
                        <td class="text-right bold" style="color:#dc2626;">{{currency}} {{rest_amount}}</td>
                    </tr>
                </table>
            </div>

            <div class="footer-note">
                <p>This is a system auto-generated computer document profile track. Signature representation is not required.</p>
                <p style="margin-top:3px;">© 2026 KLAR TRAVELS. All Rights Reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return handlebars.compile(templateHtml)(invoice);
  }
};