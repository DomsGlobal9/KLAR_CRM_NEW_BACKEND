import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

export const leadStageVoucherPdfService = {
  /**
   * Compiles data context values down into cleanly-styled responsive HTML layouts
   */
  async generateHTML(voucherData: any): Promise<string> {
    console.log("9 leadStageVoucherPdf.service.ts", voucherData)
    if (!voucherData) {
      throw new Error("Template engine context structure cannot be blank.");
    }

    // Register a conditional equal checking helper for Handlebars template logic loops
    handlebars.registerHelper('eq', (a: any, b: any) => a === b);

    const templateHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Voucher Confirmation</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8f9fa; padding: 30px 0; color: #334155; }
            .container { max-width: 800px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-top: 6px solid #7c3aed; }
            .content { padding: 35px; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
            .logo-text { font-size: 24px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px; }
            .company-details { text-align: right; font-size: 11px; color: #64748b; line-height: 1.5; }
            .doc-title { text-align: center; color: #1e1b4b; font-size: 20px; margin: 25px 0; font-weight: 700; tracking: 0.5px; }
            .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #faf5ff; border: 1px solid #f3e8ff; border-radius: 8px; }
            .info-grid td { padding: 12px 15px; border: 1px solid #f3e8ff; font-size: 13px; }
            .label { font-weight: 700; color: #6b21a8; width: 30%; }
            .value { color: #334155; }
            .service-block { border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 20px; border-radius: 8px; background: #ffffff; page-break-inside: avoid; }
            .service-title { font-size: 15px; color: #7c3aed; font-weight: 700; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; text-transform: uppercase; }
            .spec-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            .spec-table td { padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 12px; }
            .spec-key { font-weight: 600; color: #64748b; background-color: #f8f9fa; width: 35%; text-transform: capitalize; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
        </style>
    </head>
    <body>
        <div class="container">
          <div class="content">
            <table class="header-table">
                <tr>
                    <td style="vertical-align: middle;"><div class="logo-text">KLAR TRAVELS</div></td>
                    <td class="company-details">
                        #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
                        HYDERABAD - 500 073 | Mob: +918099359377<br>
                        GSTIN: 36BGCPS2420P1Z4
                    </td>
                </tr>
            </table>

            <div class="doc-title">LEAD STAGE VOUCHER REQUIREMENTS</div>

            <table class="info-grid">
                <tr>
                    <td class="label">Client Name</td>
                    <td class="value">${voucherData.lead_name}</td>
                    <td class="label">Generated Date</td>
                    <td class="value">${new Date(voucherData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
                <tr>
                    <td class="label">Email Address</td>
                    <td class="value">${voucherData.lead_email || 'N/A'}</td>
                    <td class="label">Phone / Mob</td>
                    <td class="value">${voucherData.lead_phone || 'N/A'}</td>
                </tr>
            </table>

            <div style="font-size: 14px; font-weight: 700; color: #1e1b4b; margin-bottom: 15px; uppercase">📦 SERVICE SPECIFICATIONS</div>

            {{#each service_configurations}}
            <div class="service-block">
                <div class="service-title">⚙️ {{serviceName}}</div>
                <table class="spec-table">
                    {{#each configurations}}
                    <tr>
                        <td class="spec-key">{{@key}}</td>
                        <td class="value">{{this}}</td>
                    </tr>
                    {{/each}}
                </table>
            </div>
            {{/each}}

            <div class="footer">
                Thank you for coordinating with KLAR Travels. This is a system-generated requirements confirmation document.
            </div>
          </div>
        </div>
    </body>
    </html>
    `;

    return handlebars.compile(templateHtml)(voucherData);
  },

  /**
   * Compiles HTML content layout string directly into an safe A4 binary buffer string
   */
  async generateBuffer(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] 
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ 
        format: 'A4', 
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
    });
    await browser.close();
    return Buffer.from(pdf);
  }
};