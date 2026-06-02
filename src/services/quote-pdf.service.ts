import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const quotePdfService = {
    async generateHTML(quoteData: any): Promise<string> {
        
        const hostedLogoUrl = 'https://travel-pdfs-prod-399934155938-eu-north-1-an.s3.eu-north-1.amazonaws.com/pdf/Frame%201000007152%202.png';

        const logoHtmlTag = `<img src="${hostedLogoUrl}" style="max-height: 60px; display: block;" alt="KLAR TRAVELS" />`;

        if (!handlebars.helpers['formatDocDate']) {
            handlebars.registerHelper('formatDocDate', (dateStr: string) => {
                if (!dateStr) return 'N/A';
                try {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                } catch (e) {
                    return dateStr;
                }
            });
        }

        if (!handlebars.helpers['cleanDescription']) {
            handlebars.registerHelper('cleanDescription', (descStr: string) => {
                if (!descStr) return '';
                const parts = descStr.split(':').map((p: string) => p.trim());
                if (parts.length > 1 && parts[0] === parts[1]) {
                    return parts[0];
                }
                return descStr;
            });
        }

        const templateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { margin: 15mm; }
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    font-size: 9.5pt; 
                    color: #2c3e50; 
                    line-height: 1.5; 
                    margin: 0; 
                    padding: 20px 0; 
                    background-color: #f5f5f5;
                }
                
                /* Main center-aligned layout block wrapper for the document body */
                .quote-container {
                    max-width: 1000px;
                    width: 100%;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                }
                
                /* Bulletproof Table header structure for strict layout consistency */
                .header-table {
                    width: 100%;
                    border-collapse: collapse;
                    border-spacing: 0;
                    border-bottom: 2px solid #d32f2f;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                
                .header-table td {
                    vertical-align: middle;
                    padding-bottom: 10px;
                }
                
                .logo-container {
                    text-align: left;
                }
                
                .company-info-container {
                    text-align: right;
                    font-size: 8.5pt;
                    color: #444;
                    line-height: 1.4;
                }
                
                .company-name { font-weight: 800; color: #4b0082; font-size: 15pt; letter-spacing: 0.5px; margin-bottom: 2px; }
                .doc-title { text-align: center; color: #d32f2f; font-size: 19pt; font-weight: bold; margin: 20px 0; letter-spacing: 0.5px; text-decoration: underline; }
                
                /* Detailed layout structured grid setup */
                .details-box { border: 1px solid #b0b0b0; padding: 14px; margin-bottom: 18px; background: #fff; border-radius: 4px; }
                .grid-2 { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px; }
                
                p { margin: 0; padding: 0; }
                .field-label { color: #555; font-weight: 600; font-size: 9.5pt; display: inline-block; width: 100px; }
                .field-label-right { color: #555; font-weight: 600; font-size: 9.5pt; display: inline-block; width: 85px; text-align: left; }
                .field-value { color: #111; font-weight: 500; }

                /* Structured table layout resembling Excel accounting sheet */
                table.invoice-items-table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                th { background: #4b0082; color: white; border: 1px solid #9c7bb5; padding: 11px 10px; text-align: left; font-size: 9.5pt; font-weight: bold; }
                td { border: 1px solid #b0b0b0; padding: 11px 10px; vertical-align: middle; font-size: 9.5pt; }
                
                .total-row { background: #fff5f5; font-weight: bold; }
                .total-row td { border-top: 2px solid #4b0082; }
                
                /* Clean up canvas styles during automated physical page prints */
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    .quote-container {
                        max-width: 100%;
                        padding: 0;
                        box-shadow: none;
                        border-radius: 0;
                    }
                }
            </style>
        </head>
        <body>
            
            <div class="quote-container">
                
                <table class="header-table">
                    <tr>
                        <td class="logo-container" style="width: 50%;">
                            ${logoHtmlTag}
                        </td>
                        <td class="company-info-container" style="width: 50%;">
                            <div class="company-name">KLAR TRAVELS</div>
                            HYDERABAD | Mob: +918099359377<br>
                            <strong>GSTIN: 36BGCPS2420P1Z4</strong>
                        </td>
                    </tr>
                </table>

                <div class="doc-title">COMMERCIAL QUOTATION</div>

                <div class="details-box">
                    <div class="grid-2">
                        <div>
                            <p style="margin-bottom: 6px;"><span class="field-label">Client Name:</span><span class="field-value" style="font-weight: bold;">{{client_name}}</span></p>
                            <p style="margin-bottom: 6px;"><span class="field-label">Client Email:</span><span class="field-value">{{client_email}}</span></p>
                            <p><span class="field-label">Quote No:</span><span class="field-value" style="font-weight: bold; color: #d32f2f;">{{quote_number}}</span></p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin-bottom: 6px;"><span class="field-label-right">Date:</span><span class="field-value">{{formatDocDate created_at}}</span></p>
                            <p><span class="field-label-right">Valid Until:</span><span class="field-value">{{formatDocDate valid_until}}</span></p>
                        </div>
                    </div>
                </div>

                <table class="invoice-items-table">
                    <thead>
                        <tr>
                            <th>ITEM DESCRIPTION</th>
                            <th style="text-align:center; width: 10%;">QTY</th>
                            <th style="text-align:right; width: 22%;">UNIT COST</th>
                            <th style="text-align:right; width: 22%;">TOTAL ({{currency}})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each line_items}}
                        <tr>
                            <td>
                                <strong style="color: #4b0082; font-size: 10pt;">{{cleanDescription description}}</strong><br>
                                <small style="color:#555; margin-top: 5px; display: inline-block; line-height: 1.3;">
                                    {{#if details.baseFare}} Flight Base Fare: ₹{{details.baseFare}} | {{/if}}
                                    {{#if details.roomCharges}} Room Rent Charges: ₹{{details.roomCharges}} | {{/if}}
                                    {{#if details.vehicleCost}} Vehicle Cost Base: ₹{{details.vehicleCost}} | {{/if}}
                                    {{#if details.driverAllowance}} Driver Allowance: ₹{{details.driverAllowance}} | {{/if}}
                                    {{#if details.tollParking}} Toll & Parking: ₹{{details.tollParking}} | {{/if}}
                                    {{#if details.fuelCharges}} Fuel Charges: ₹{{details.fuelCharges}} | {{/if}}
                                    {{#if details.crewCharges}} Crew Charges: ₹{{details.crewCharges}} | {{/if}}
                                    
                                    {{#each details.categories}}
                                        {{category_name}}: {{#each sub_services}}{{sub_service_name}}{{/each}} | 
                                    {{/each}}
                                </small>
                            </td>
                            <td style="text-align:center; font-weight: bold;">{{quantity}}</td>
                            <td style="text-align:right; font-weight: 500;">{{unit_price}}</td>
                            <td style="text-align:right; font-weight: bold;">
                                {{#if total_price}}{{total_price}}{{else}}{{total}}{{/if}}
                            </td>
                        </tr>
                        {{/each}}
                        <tr class="total-row">
                            <td colspan="3" style="text-align:right; font-weight: bold;">SUBTOTAL</td>
                            <td style="text-align:right; font-weight: bold;">{{subtotal}}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align:right; color: #555; font-weight: 600;">
                                TAX {{#if tax_rate}}({{tax_rate}}%){{else}}(0%){{/if}}
                            </td>
                            <td style="text-align:right; color: #555; font-weight: 600;">{{tax_amount}}</td>
                        </tr>
                        <tr class="total-row" style="color: #d32f2f; font-size: 11.5pt; background: #fdf2f2;">
                            <td colspan="3" style="text-align:right; font-weight: bold;">NET PAYABLE</td>
                            <td style="text-align:right; font-weight: 900;">{{currency}} {{final_amount}}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="details-box" style="font-size: 9pt; color: #444; line-height: 1.6;">
                    <strong style="color: #4b0082; font-size: 9.5pt;">Terms & Conditions:</strong><br>
                    {{#if terms_conditions}}
                        {{terms_conditions}}
                    {{else}}
                        1. Rates are based on the current component availability specifications.<br>
                        2. Standard commercial guidelines apply as per schedule arrangements.
                    {{/if}}
                    
                    {{#if notes}}
                    <br><br>
                    <strong style="color: #4b0082; font-size: 9.5pt;">Important Notes:</strong><br>
                    <span style="font-family: monospace; color: #555;">{{notes}}</span>
                    {{/if}}
                </div>
                
                <div style="margin-top: 35px; text-align: center; color: #d32f2f; font-style: italic; font-weight: bold; font-size: 9.5pt;">
                    (This is a computer-generated document. Signature not required)
                    <br><small style="color:#777; font-weight: normal; font-size: 8pt; margin-top: 4px; display: inline-block;">Every journey begins with trust.</small>
                </div>
            </div>
        </body>
        </html>
        `;

        return handlebars.compile(templateHtml)({
            ...quoteData,
            logoHtmlTag
        });
    },

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
        
        // Using 'networkidle0' with type assertion to avoid TypeScript error
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