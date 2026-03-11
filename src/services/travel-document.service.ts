// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';
// import fs from 'fs';
// import path from 'path';

// export const travelDocumentService = {
//     async generateTravelProposalHTML(itineraryData: any, quoteData: any): Promise<string> {
//         // Logo Setup
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
//                 @page { margin: 0; }
//                 body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 0; padding: 0; }
//                 .container { padding: 40px; }
//                 .header { display: flex; justify-content: space-between; border-bottom: 3px solid #d32f2f; padding-bottom: 20px; }
//                 .hero-section { background: #f8f9fa; padding: 40px; border-radius: 12px; margin: 20px 0; text-align: center; }
//                 .section-title { font-size: 16pt; color: #4b0082; border-left: 5px solid #d32f2f; padding-left: 15px; margin: 30px 0 15px; text-transform: uppercase; }
                
//                 /* Table Styling */
//                 table { width: 100%; border-collapse: collapse; margin-top: 10px; }
//                 th { background: #4b0082; color: white; text-align: left; padding: 12px; }
//                 td { border-bottom: 1px solid #eee; padding: 12px; vertical-align: top; }
                
//                 /* Pricing Box */
//                 .pricing-container { margin-top: 30px; background: #fffaf0; border: 1px solid #ffe0b2; border-radius: 8px; padding: 20px; }
//                 .total-row { font-size: 18pt; font-weight: bold; color: #d32f2f; text-align: right; }
                
//                 .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 9pt; font-weight: bold; }
//                 .footer { text-align: center; font-size: 8pt; color: #888; margin-top: 50px; }
//             </style>
//         </head>
//         <body>
//             <div class="container">
//                 <div class="header">
//                     <img src="${base64Logo}" style="max-height: 60px;" />
//                     <div style="text-align: right;">
//                         <div style="font-weight: bold; font-size: 14pt;">CONFIDENTIAL QUOTATION</div>
//                         <div>Ref: {{quote.quote_number}}</div>
//                         <div>Date: {{quote.created_at}}</div>
//                     </div>
//                 </div>

//                 <div class="hero-section">
//                     <h1 style="margin: 0; color: #d32f2f;">Travel Proposal for {{quote.client_name}}</h1>
//                     <p style="font-size: 12pt; color: #666;">Destination: {{itinerary.service_preferences.0.preferences.destination}}</p>
//                 </div>

//                 <div class="section-title">🗓️ Itinerary Details</div>
//                 {{#each itinerary.service_preferences}}
//                 <div style="background: #fff; border: 1px solid #eee; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
//                     <div style="display: flex; justify-content: space-between; align-items: center;">
//                         <h3 style="margin: 0;">{{title}}</h3>
//                         <span class="badge">{{service_type}}</span>
//                     </div>
//                     <p style="color: #666;">{{description}}</p>
                    
//                     <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px;">
//                         <div>
//                             <strong>Travel Dates:</strong> {{preferences.tour_start_date}} to {{preferences.tour_end_date}}<br>
//                             <strong>Tour Type:</strong> {{preferences.tour_type}}
//                         </div>
//                         <div>
//                             <strong>Inclusions:</strong> {{preferences.inclusions}}<br>
//                             <strong>Package:</strong> {{preferences.package_type}}
//                         </div>
//                     </div>
//                 </div>
//                 {{/each}}

//                 <div class="section-title">💰 Commercial Quote</div>
//                 <table>
//                     <thead>
//                         <tr>
//                             <th>Description</th>
//                             <th style="text-align: center;">Qty</th>
//                             <th style="text-align: right;">Unit Price</th>
//                             <th style="text-align: right;">Total</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {{#each quote.line_items}}
//                         <tr>
//                             <td>
//                                 <strong>{{description}}</strong><br>
//                                 <small style="color: #777;">
//                                     {{#each details.categories}}
//                                         {{category_name}}: {{#each sub_services}}{{sub_service_name}}{{/each}} |
//                                     {{/each}}
//                                 </small>
//                             </td>
//                             <td style="text-align: center;">{{quantity}}</td>
//                             <td style="text-align: right;">{{quote.currency}} {{unit_price}}</td>
//                             <td style="text-align: right;">{{quote.currency}} {{total}}</td>
//                         </tr>
//                         {{/each}}
//                     </tbody>
//                 </table>

//                 <div class="pricing-container">
//                     <div style="display: flex; justify-content: flex-end; gap: 50px;">
//                         <div style="text-align: right; color: #666;">
//                             Subtotal:<br>
//                             Tax ({{quote.totals.tax_rate}}%):<br>
//                             Discount:<br>
//                             <span style="font-size: 14pt; color: #000; font-weight: bold;">Grand Total:</span>
//                         </div>
//                         <div style="text-align: right; font-weight: bold;">
//                             {{quote.currency}} {{quote.subtotal}}<br>
//                             {{quote.currency}} {{quote.tax_amount}}<br>
//                             - {{quote.currency}} {{quote.discount_amount}}<br>
//                             <span style="font-size: 14pt; color: #d32f2f;">{{quote.currency}} {{quote.final_amount}}</span>
//                         </div>
//                     </div>
//                 </div>

//                 <div style="margin-top: 30px; font-size: 10pt;">
//                     <strong>Terms & Conditions:</strong><br>
//                     {{quote.terms_conditions}}
//                 </div>

//                 <div class="footer">
//                     Valid Until: {{quote.valid_until}} | Generated by Klar Travel CRM
//                 </div>
//             </div>
//         </body>
//         </html>
//         `;

//         const template = handlebars.compile(templateHtml);
//         return template({
//             itinerary: itineraryData,
//             quote: quoteData,
//             // Format dates for display
//             date_formatted: new Date().toLocaleDateString('en-IN')
//         });
//     },

//     async generatePDFBuffer(html: string): Promise<Buffer> {
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

export const travelDocumentService = {
    async generateTravelProposalHTML(itineraryData: any, quoteData: any): Promise<string> {
        const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
        let base64Logo = '';
        try {
            const bitmap = fs.readFileSync(logoPath);
            base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
        } catch (e) { console.error("Logo missing at path:", logoPath); }

        const templateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { margin: 20mm; }
                body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 0; line-height: 1.4; font-size: 10pt; }
                
                /* Fixed Header for every page */
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; margin-bottom: 20px; }
                .company-details { text-align: right; font-size: 8pt; color: #444; }
                .company-name { font-weight: bold; color: #4b0082; font-size: 14pt; margin-bottom: 2px; }
                
                .page-break { page-break-after: always; }
                
                /* Titles and Sections */
                .doc-title { text-align: center; color: #d32f2f; font-size: 18pt; text-decoration: underline; margin: 20px 0; font-weight: bold; }
                .section-header { border-left: 5px solid #d32f2f; padding-left: 10px; color: #4b0082; font-size: 13pt; font-weight: bold; margin: 20px 0 10px 0; background: #f9f9f9; }
                
                /* Tables matching the style in your reference images */
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th { background: #f2f2f2; border: 1px solid #ccc; padding: 8px; text-align: left; color: #4b0082; }
                td { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
                
                .pricing-table th { background: #fff5f5; text-align: center; }
                .total-row { background: #fff5f5; font-weight: bold; font-size: 12pt; }
                .text-red { color: #d32f2f; font-weight: bold; }
                
                .details-box { border: 1px solid #ddd; border-radius: 5px; padding: 15px; background: #fff; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${base64Logo}" style="max-height: 60px;" />
                <div class="company-details">
                    <div class="company-name">KLAR TRAVELS</div>
                    #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
                    HYDERABAD - 500 0073 | Tel: +914023745112, 42603413<br>
                    Mob: +918099359377 | Email: praveentour1@gmail.com<br>
                    <strong>GSTIN: 36BGCPS2420P1Z1</strong>
                </div>
            </div>

            <div class="doc-title">TRAVEL PROPOSAL & QUOTATION</div>

            <div class="details-box">
                <table style="border:none;">
                    <tr style="border:none;">
                        <td style="border:none;"><strong>Client Name:</strong> {{quote.client_name}}</td>
                        <td style="border:none; text-align: right;"><strong>Quote Ref:</strong> {{quote.quote_number}}</td>
                    </tr>
                    <tr style="border:none;">
                        <td style="border:none;"><strong>Contact:</strong> {{quote.client_phone}}</td>
                        <td style="border:none; text-align: right;"><strong>Date:</strong> {{date_formatted}}</td>
                    </tr>
                </table>
            </div>

            <div class="section-header">📍 ITINERARY DETAILS</div>
            {{#each itinerary.service_preferences}}
            <div class="details-box">
                <h3 style="margin-top:0; color:#d32f2f;">{{title}}</h3>
                <p><strong>Destination:</strong> {{preferences.destination}}</p>
                <p><strong>Duration:</strong> {{preferences.duration}} Days</p>
                <p><strong>Travel Dates:</strong> {{preferences.tour_start_date}} to {{preferences.tour_end_date}}</p>
                <p><strong>Tour Type:</strong> {{preferences.tour_type}} | <strong>Package:</strong> {{preferences.package_type}}</p>
                <p><strong>Inclusions:</strong> {{preferences.inclusions}}</p>
                {{#if preferences.special_requirements}}
                <p><strong>Special Requirements:</strong> {{preferences.special_requirements}}</p>
                {{/if}}
            </div>
            {{/each}}

            <div class="page-break"></div>

            <div class="section-header">💰 COMMERCIAL QUOTE</div>
            <table class="pricing-table">
                <thead>
                    <tr>
                        <th>DESCRIPTION</th>
                        <th style="width: 10%; text-align: center;">QTY</th>
                        <th style="width: 25%; text-align: right;">PER PERSON ({{quote.currency}})</th>
                        <th style="width: 25%; text-align: right;">TOTAL ({{quote.currency}})</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each quote.line_items}}
                    <tr>
                        <td>
                            <strong>{{description}}</strong><br>
                            <small>
                                {{#each details.categories}}
                                    {{category_name}}: {{#each sub_services}}{{sub_service_name}}{{/each}} |
                                {{/each}}
                            </small>
                        </td>
                        <td style="text-align: center;">{{quantity}}</td>
                        <td style="text-align: right;">{{unit_price}}</td>
                        <td style="text-align: right;">{{total}}</td>
                    </tr>
                    {{/each}}
                    <tr class="total-row">
                        <td colspan="3" style="text-align: right;">SUBTOTAL</td>
                        <td style="text-align: right;">{{quote.subtotal}}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right;">GST ({{quote.totals.tax_rate}}%)</td>
                        <td style="text-align: right;">{{quote.tax_amount}}</td>
                    </tr>
                    <tr class="total-row" style="color: #d32f2f;">
                        <td colspan="3" style="text-align: right; font-size: 14pt;">GRAND TOTAL</td>
                        <td style="text-align: right; font-size: 14pt;">{{quote.currency}} {{quote.final_amount}}</td>
                    </tr>
                </tbody>
            </table>

            <div class="section-header">📜 TERMS & CONDITIONS</div>
            <div class="details-box" style="font-size: 9pt;">
                {{quote.terms_conditions}}
                <br><br>
                <strong>Notes:</strong><br>
                {{quote.notes}}
            </div>

            <div style="margin-top: 30px; text-align: center; color: #d32f2f; font-style: italic; font-weight: bold;">
                (This is a computer-generated document. Signature not required)
            </div>
        </body>
        </html>
        `;

        const template = handlebars.compile(templateHtml);
        return template({
            itinerary: itineraryData,
            quote: quoteData,
            date_formatted: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        });
    },

    // Fixed function name to match your controller call
    async generatePDFBuffer(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Add header/footer to every page via puppeteer options
        const pdf = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });
        
        await browser.close();
        return Buffer.from(pdf);
    }
};

















