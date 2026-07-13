import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

export const leadStageVoucherPdfService = {
  /**
   * Compiles data context values down into cleanly-styled responsive HTML layouts
   * aligned perfectly with the itinerary brand theme.
   */
  async generateHTML(voucherData: any, forEmail: boolean = false): Promise<string> {
    console.log("9 leadStageVoucherPdf.service.ts", voucherData);
    if (!voucherData) {
      throw new Error("Template engine context structure cannot be blank.");
    }

    const logoUrl = 'https://travel-pdfs-prod-399934155938-eu-north-1-an.s3.eu-north-1.amazonaws.com/pdf/Frame%201000007152%202.png';
    const logoHtmlTag = logoUrl 
      ? `<img src="${logoUrl}" alt="KLAR TRAVELS" />` 
      : '<div style="font-weight: bold; color: #4b0082; font-size: 16px;">KLAR TRAVELS</div>';

    // Register a conditional equal checking helper for Handlebars template logic loops
    handlebars.registerHelper('eq', (a: any, b: any) => a === b);

    const templateHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Voucher Confirmation</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
                font-family: 'Arial', 'Helvetica', sans-serif; 
                background-color: #f5f5f5; 
                padding: 20px 0; 
                color: #222222; 
            }
            
            .email-container { 
                max-width: 800px; 
                width: 100%; 
                margin: 0 auto; 
                background-color: #ffffff; 
                border-radius: 8px; 
                overflow: hidden; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            }
            
            .email-content { 
                padding: 20px 25px; 
                background: #fff;
            }
            
            .header-table { 
                width: 100%; 
                border-collapse: collapse; 
                border-spacing: 0;
                margin-bottom: 20px; 
                border-bottom: 2px solid #d32f2f; 
            }
            
            .header-table td {
                padding-bottom: 15px;
                vertical-align: top;
            }
            
            .logo-container { 
                text-align: left; 
                width: 50%;
            }
            
            .logo-container img { 
                max-height: 55px; 
                width: auto; 
                display: block; 
            }
            
            .company-details { 
                text-align: right; 
                width: 50%;
                font-size: 9pt; 
                color: #444; 
                line-height: 1.4; 
            }
            
            .company-name { 
                font-weight: bold; 
                color: #4b0082; 
                font-size: 13pt; 
                margin-bottom: 5px; 
            }
            
            .doc-title { 
                text-align: center; 
                color: #d32f2f; 
                font-size: 18pt; 
                margin: 20px 0; 
                font-weight: bold; 
                text-decoration: underline;
            }
            
            .section-header { 
                border-left: 5px solid #d32f2f; 
                padding: 8px 12px; 
                color: #4b0082; 
                font-size: 12pt; 
                font-weight: bold; 
                margin: 20px 0 12px 0; 
                background: #f2f2f2; 
                text-transform: uppercase; 
            }
            
            .details-box { 
                border: 1px solid #ddd; 
                padding: 15px; 
                margin: 0 0 15px 0; 
                border-radius: 6px; 
                background: #fff; 
                page-break-inside: avoid; 
            }
            
            .excel-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 10px; 
                font-size: 10pt; 
                background: #fff; 
            }
            
            .excel-table td { 
                border: 1px solid #ddd; 
                padding: 8px 10px; 
                vertical-align: top; 
            }
            
            .excel-table tr:first-child td {
                border-top: 1px solid #ddd;
            }
            
            .label { 
                color: #666; 
                font-weight: bold; 
                display: inline-block; 
                min-width: 110px; 
            }
            
            .value { 
                color: #222; 
            }
            
            .service-title { 
                font-size: 12pt; 
                color: #4b0082; 
                font-weight: bold; 
                margin-bottom: 8px; 
            }
            
            .footer { 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 1px solid #eee; 
                text-align: center; 
                color: #555; 
                font-size: 9pt; 
            }

            /* Responsive adjustments for mobile screen views */
            @media only screen and (max-width: 600px) {
                .header-table td {
                    display: block !important;
                    width: 100% !important;
                    text-align: center !important;
                    padding-bottom: 15px !important;
                }
                .company-details {
                    text-align: center !important;
                    margin-top: 10px;
                }
                .logo-container {
                    text-align: center !important;
                    margin-bottom: 10px;
                }
                .logo-container img {
                    margin: 0 auto !important;
                }
                .excel-table td {
                    display: block;
                    width: 100%;
                    border: none;
                    border-bottom: 1px solid #eee;
                    padding: 8px;
                }
                .excel-table tr {
                    display: block;
                    border: 1px solid #ddd;
                    margin-bottom: 10px;
                }
                .excel-table td:last-child {
                    border-bottom: none;
                }
            }

            @media print {
                body { background: white; padding: 0; margin: 0; }
                .email-container { max-width: 100%; margin: 0; box-shadow: none; }
                .details-box { break-inside: avoid; page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
          <div class="email-content">
            <table class="header-table">
                <tr>
                    <td class="logo-container">
                        ${logoHtmlTag}
                    </td>
                    <td class="company-details">
                        <div class="company-name">KLAR TRAVELS</div>
                        #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
                        HYDERABAD - 500 073 | Mob: +918099359377 | GSTIN: 36BGCPS2420P1Z4
                    </td>
                </tr>
            </table>

            <div class="doc-title">LEAD STAGE VOUCHER REQUIREMENTS</div>

            <div class="details-box">
                <table class="excel-table">
                    <tr>
                        <td><span class="label">Client Name:</span> <span class="value">${voucherData.lead_name}</span></td>
                        <td><span class="label">Generated Date:</span> <span class="value">${new Date(voucherData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></td>
                    </tr>
                    <tr>
                        <td><span class="label">Email Address:</span> <span class="value">${voucherData.lead_email || 'N/A'}</span></td>
                        <td><span class="label">Phone / Mob:</span> <span class="value">${voucherData.lead_phone || 'N/A'}</span></td>
                    </tr>
                </table>
            </div>

            <div class="section-header">📦 SERVICE SPECIFICATIONS</div>

            {{#each service_configurations}}
            <div class="details-box">
                <div class="service-title">⚙️ {{serviceName}}</div>
                <table class="excel-table">
                    {{#each configurations}}
                    <tr>
                        <td style="width: 40%; text-transform: capitalize;"><span class="label">{{@key}}</span></td>
                        <td style="width: 60%;" class="value">{{this}}</td>
                    </tr>
                    {{/each}}
                </table>
            </div>
            {{#unless @last}}
            {{/unless}}
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
   * Compiles HTML content layout string directly into a safe A4 binary buffer string
   */
  async generateBuffer(html: string): Promise<Buffer> {
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
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
    });
    await browser.close();
    return Buffer.from(pdf);
  }
};