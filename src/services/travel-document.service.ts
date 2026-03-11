








// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';
// import fs from 'fs';
// import path from 'path';

// export const travelDocumentService = {
//     async generateTravelProposalHTML(itineraryData: any, quoteData: any): Promise<string> {
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
                
//                 /* Recurring Header */
//                 .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; margin-bottom: 20px; }
//                 .company-details { text-align: right; font-size: 8pt; color: #444; line-height: 1.2; }
//                 .company-name { font-weight: bold; color: #4b0082; font-size: 14pt; margin-bottom: 2px; }
                
//                 .page-break { page-break-after: always; }
//                 .doc-title { text-align: center; color: #d32f2f; font-size: 18pt; text-decoration: underline; margin: 20px 0; font-weight: bold; }
                
//                 /* Layout */
//                 .section-header { border-left: 5px solid #d32f2f; padding: 5px 10px; color: #4b0082; font-size: 12pt; font-weight: bold; margin: 20px 0 10px 0; background: #f2f2f2; text-transform: uppercase; }
//                 .details-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 4px; background: #fff; }
                
//                 /* Tables */
//                 table { width: 100%; border-collapse: collapse; margin: 10px 0; }
//                 th { background: #4b0082; color: white; border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 9pt; }
//                 td { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
                
//                 .pricing-table th { background: #fff5f5; color: #d32f2f; text-align: center; }
//                 .total-row { background: #fff5f5; font-weight: bold; }
//                 .label { color: #666; font-weight: bold; width: 150px; display: inline-block; }
//                 .service-badge { background: #d32f2f; color: white; padding: 2px 8px; border-radius: 10px; font-size: 8pt; float: right; }
//             </style>
//         </head>
//         <body>
//             <div class="header">
//                 <img src="${base64Logo}" style="max-height: 60px;" />
//                 <div class="company-details">
//                     <div class="company-name">KLAR TRAVELS</div>
//                     #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
//                     HYDERABAD - 500 0073 | Tel: +914023745112, 42603413<br>
//                     Mob: +918099359377 | Email: praveentour1@gmail.com<br>
//                     <strong>GSTIN: 36BGCPS2420P1Z4</strong>
//                 </div>
//             </div>

//             <div class="doc-title">PROPOSAL & QUOTATION</div>

//             <div class="details-box">
//                 <div style="display: flex; justify-content: space-between;">
//                     <div>
//                         <p><strong>Client Name:</strong> {{itinerary.lead_details.name}}</p>
//                         <p><strong>Contact:</strong> {{itinerary.lead_details.phone}}</p>
//                         <p><strong>Email:</strong> {{itinerary.lead_details.email}}</p>
//                     </div>
//                     <div style="text-align: right;">
//                         <p><strong>Quote No:</strong> {{quote.quote_number}}</p>
//                         <p><strong>Date:</strong> {{date_formatted}}</p>
//                         <p><strong>Location:</strong> {{itinerary.lead_details.metadata.country_city}}</p>
//                         <p><strong>Estimated Price:</strong> {{itinerary.service_preferences.0.preferences.estimated_price_per_person}}</p>

//                     </div>
//             </div>
//             <div class="section-header">📍 ITINERARY & SERVICE DETAILS</div>

//             {{#each itinerary.service_preferences}}
//             <div class="details-box">
//                 <span class="service-badge">{{service_type}}</span>
//                 <h3 style="margin:0 0 10px 0; color:#4b0082;">{{title}}</h3>
                
//                 {{#if (eq service_type "CHARTER_SERVICES")}}
//                 <p><span class="label">Aircraft Type:</span> {{preferences.aircraft_type}}</p>
//                 <p><span class="label">Ports:</span> {{preferences.departure_port}} ➔ {{preferences.arrival_port}}</p>
//                 <p><span class="label">Date:</span> {{preferences.charter_start}} to {{preferences.charter_end}}</p>
//                 <p><span class="label">Pax Capacity:</span> {{preferences.passenger_capacity}} | <strong>Guests:</strong> {{preferences.guests}}</p>
//                 <p><span class="label">Catering:</span> {{preferences.catering_services}}</p>
//                 {{/if}}

//                 {{#if (eq service_type "EVENT_MANAGEMENT")}}
//                 <p><span class="label">Event Type:</span> {{preferences.event_type}}</p>
//                 <p><span class="label">Venue:</span> {{preferences.venue}}</p>
//                 <p><span class="label">Date:</span> {{preferences.event_date}}</p>
//                 <p><span class="label">Scale:</span> {{preferences.event_scale}} ({{preferences.attendees}} Attendees)</p>
//                 <p><span class="label">Entertainment:</span> {{preferences.catering_entertainment}}</p>
//                 {{/if}}

//                 {{#if (eq service_type "YACHT_CHARTER")}}
//                 <p><span class="label">Yacht Type:</span> {{preferences.yacht_type}}</p>
//                 <p><span class="label">Departure:</span> {{preferences.departure_port}} | <strong>Arrival:</strong> {{preferences.arrival_port}}</p>
//                 <p><span class="label">Duration:</span> {{preferences.charter_duration}}</p>
//                 <p><span class="label">Dates:</span> {{preferences.charter_start}} to {{preferences.charter_end}}</p>
//                 <p><span class="label">Crew:</span> {{preferences.crew_services}} | <strong>Amenities:</strong> {{preferences.yacht_amenities}}</p>
//                 {{/if}}

//                 {{#if (eq service_type "TOUR_PACKAGES")}}
//                 <p><span class="label">Destination:</span> {{preferences.destination}}</p>
//                 <p><span class="label">Dates:</span> {{preferences.tour_start_date}} to {{preferences.tour_end_date}}</p>
//                 <p><span class="label">Type:</span> {{preferences.tour_type}} | <strong>Duration:</strong> {{preferences.duration}} Days</p>
//                 <p><span class="label">Inclusions:</span> {{preferences.inclusions}}</p>
//                 {{/if}}

//                 {{#if (eq service_type "VISA_SERVICES")}}
//                 <p><span class="label">Visa Type:</span> {{preferences.visa_type}}</p>
//                 <p><span class="label">Processing:</span> {{preferences.processing_time}}</p>
//                 <p><span class="label">Checklist:</span> {{preferences.document_checklist}}</p>
//                 {{/if}}

//                 {{#if preferences.special_requirements}}
//                 <p style="margin-top:10px; color:#d32f2f;"><strong>Requirements:</strong> {{preferences.special_requirements}}</p>
//                 {{/if}}
//             </div>
//             {{/each}}

//             <div class="page-break"></div>

//             <div class="section-header">💰 COMMERCIAL QUOTE</div>
//             <table>
//                 <thead>
//                     <tr>
//                         <th>DESCRIPTION</th>
//                         <th style="text-align:center;">QTY</th>
//                         <th style="text-align:right;">UNIT PRICE ({{quote.currency}})</th>
//                         <th style="text-align:right;">TOTAL ({{quote.currency}})</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {{#each quote.line_items}}
//                     <tr>
//                         <td>
//                             <strong>{{description}}</strong><br>
//                             <small>
//                                 {{#each details.categories}}
//                                     {{category_name}}: {{#each sub_services}}{{sub_service_name}}{{/each}} |
//                                 {{/each}}
//                             </small>
//                         </td>
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
//                     <tr class="total-row" style="color: #d32f2f; font-size: 14pt;">
//                         <td colspan="3" style="text-align:right;">GRAND TOTAL</td>
//                         <td style="text-align:right;">{{quote.currency}} {{quote.final_amount}}</td>
//                     </tr>
//                 </tbody>
//             </table>

//             <div class="section-header">📜 TERMS & CONDITIONS</div>
//             <div class="details-box" style="font-size: 8.5pt; white-space: pre-line;">
//                 {{quote.terms_conditions}}
//                 <br>
//                 <strong>Important Notes:</strong>
//                 {{quote.notes}}
//             </div>

//             <div style="margin-top: 30px; text-align: center; color: #d32f2f; font-style: italic; font-weight: bold;">
//                 (This is a computer-generated document. Signature not required)
//                 <br><small style="color:#888;">Every journey begins with trust.</small>
//             </div>
//         </body>
//         </html>
//         `;

//         // Equality helper for service_type check
//         handlebars.registerHelper('eq', function (a, b) { return a === b; });

//         const template = handlebars.compile(templateHtml);
//         return template({
//             itinerary: itineraryData,
//             quote: quoteData,
//             date_formatted: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
//         });
//     },

//     async generatePDFBuffer(html: string): Promise<Buffer> {
//         const browser = await puppeteer.launch({
//             headless: true,
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

export const travelDocumentService = {
    async generateTravelProposalHTML(itineraryData: any, quoteData: any): Promise<string> {
        const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
        let base64Logo = '';
        try {
            const bitmap = fs.readFileSync(logoPath);
            base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
        } catch (e) { console.error("Logo missing"); }

        // Register Equality Helper
        handlebars.registerHelper('eq', (a, b) => a === b);

        const templateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { margin: 15mm; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 0; line-height: 1.4; font-size: 9.5pt; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; margin-bottom: 20px; }
                .company-details { text-align: right; font-size: 8pt; color: #444; }
                .company-name { font-weight: bold; color: #4b0082; font-size: 14pt; }
                
                .doc-title { text-align: center; color: #d32f2f; font-size: 18pt; text-decoration: underline; margin: 15px 0; font-weight: bold; }
                .section-header { border-left: 5px solid #d32f2f; padding: 5px 10px; color: #4b0082; font-size: 12pt; font-weight: bold; margin: 20px 0 10px 0; background: #f2f2f2; text-transform: uppercase; }
                
                .details-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 4px; background: #fff; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th { background: #4b0082; color: white; border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 9pt; }
                td { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
                
                .total-row { background: #fff5f5; font-weight: bold; }
                .service-tag { background: #d32f2f; color: white; padding: 2px 8px; border-radius: 10px; font-size: 7.5pt; float: right; font-weight: bold; }
                .req-highlight { color: #d32f2f; font-weight: bold; margin-top: 8px; display: block; border-top: 1px dashed #ddd; padding-top: 5px; }
                .page-break { page-break-after: always; }
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
                    <strong>GSTIN: 36BGCPS2420P1Z4</strong>
                </div>
            </div>

            <div class="doc-title">PROPOSAL & QUOTATION</div>

            <div class="details-box">
                <div class="grid-2">
                    <div>
                        <p><strong>Client Name:</strong> {{quote.client_name}}</p>
                        <p><strong>Contact:</strong> {{quote.client_phone}}</p>
                        <p><strong>Email:</strong> {{quote.client_email}}</p>
                    </div>
                    <div style="text-align: right;">
                        <p><strong>Quote No:</strong> {{quote.quote_number}}</p>
                        <p><strong>Date:</strong> {{date_formatted}}</p>
                        <p><strong>Lead Location:</strong> {{itinerary.lead_details.metadata.country_city}}</p>
                    </div>
                </div>
            </div>

            <div class="section-header">📍 ITINERARY & SERVICE PREFERENCES</div>

            {{#each itinerary.service_preferences}}
            <div class="details-box">
                <span class="service-tag">{{service_type}}</span>
                <h3 style="margin:0 0 10px 0; color:#4b0082;">{{title}}</h3>
                
                <div class="grid-2">
                    {{#if (eq service_type "CHARTER_SERVICES")}}
                        <p><strong>Aircraft Type:</strong> {{preferences.aircraft_type}}</p>
                        <p><strong>Ports:</strong> {{preferences.departure_port}} to {{preferences.arrival_port}}</p>
                        <p><strong>Pax Capacity:</strong> {{preferences.passenger_capacity}}</p>
                        <p><strong>Duration:</strong> {{preferences.flight_duration}}</p>
                        <p><strong>Catering:</strong> {{preferences.catering_services}}</p>
                        <p><strong>Schedule:</strong> {{preferences.charter_start}} to {{preferences.charter_end}}</p>
                    {{/if}}

                    {{#if (eq service_type "YACHT_CHARTER")}}
                        <p><strong>Yacht Type:</strong> {{preferences.yacht_type}}</p>
                        <p><strong>Departure:</strong> {{preferences.departure_port}}</p>
                        <p><strong>Arrival:</strong> {{preferences.arrival_port}}</p>
                        <p><strong>Amenities:</strong> {{preferences.yacht_amenities}}</p>
                        <p><strong>Crew:</strong> {{preferences.crew_services}}</p>
                        <p><strong>Duration:</strong> {{preferences.charter_duration}}</p>
                    {{/if}}

                    {{#if (eq service_type "EVENT_MANAGEMENT")}}
                        <p><strong>Event Type:</strong> {{preferences.event_type}}</p>
                        <p><strong>Venue:</strong> {{preferences.venue}}</p>
                        <p><strong>Attendees:</strong> {{preferences.attendees}}</p>
                        <p><strong>Event Date:</strong> {{preferences.event_date}}</p>
                        <p><strong>Services:</strong> {{preferences.services_required}}</p>
                        <p><strong>Entertainment:</strong> {{preferences.catering_entertainment}}</p>
                    {{/if}}

                    {{#if (eq service_type "TOUR_PACKAGES")}}
                        <p><strong>Tour Type:</strong> {{preferences.tour_type}}</p>
                        <p><strong>Destination:</strong> {{preferences.destination}}</p>
                        <p><strong>Duration:</strong> {{preferences.duration}} Days</p>
                        <p><strong>Inclusions:</strong> {{preferences.inclusions}}</p>
                        <p><strong>Start Date:</strong> {{preferences.tour_start_date}}</p>
                        <p><strong>End Date:</strong> {{preferences.tour_end_date}}</p>
                    {{/if}}

                    {{#if (eq service_type "VISA_SERVICES")}}
                        <p><strong>Visa Category:</strong> {{preferences.visa_type}}</p>
                        <p><strong>Processing Time:</strong> {{preferences.processing_time}}</p>
                        <p><strong>Documents:</strong> {{preferences.document_checklist}}</p>
                        <p><strong>Application Date:</strong> {{preferences.date}}</p>
                    {{/if}}
                </div>

                {{#if preferences.special_requirements}}
                    <span class="req-highlight">REQUIREMENTS: {{preferences.special_requirements}}</span>
                {{/if}}
                {{#if preferences.notes}}<p><strong>Notes:</strong> {{preferences.notes}}</p>{{/if}}
            </div>
            {{/each}}

            <div class="page-break"></div>

            <div class="section-header">💰 COMMERCIAL QUOTATION</div>
            <table>
                <thead>
                    <tr>
                        <th>DESCRIPTION OF SERVICES</th>
                        <th style="text-align:center;">QTY</th>
                        <th style="text-align:right;">UNIT COST ({{quote.currency}})</th>
                        <th style="text-align:right;">TOTAL ({{quote.currency}})</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each quote.line_items}}
                    <tr>
                        <td>
                            <strong>{{description}}</strong><br>
                            <small style="color:#666;">
                                {{#each details.categories}}
                                    {{category_name}}: {{#each sub_services}}{{sub_service_name}}{{/each}} |
                                {{/each}}
                                {{#if details.exclusions}}<br>Exclusions: {{details.exclusions}}{{/if}}
                            </small>
                        </td>
                        <td style="text-align:center;">{{quantity}}</td>
                        <td style="text-align:right;">{{unit_price}}</td>
                        <td style="text-align:right;">{{total}}</td>
                    </tr>
                    {{/each}}
                    <tr class="total-row">
                        <td colspan="3" style="text-align:right;">SUBTOTAL</td>
                        <td style="text-align:right;">{{quote.subtotal}}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align:right;">GST ({{quote.tax_rate}}%)</td>
                        <td style="text-align:right;">{{quote.tax_amount}}</td>
                    </tr>
                    <tr class="total-row" style="color: #d32f2f; font-size: 13pt;">
                        <td colspan="3" style="text-align:right;">NET PAYABLE</td>
                        <td style="text-align:right;">{{quote.currency}} {{quote.final_amount}}</td>
                    </tr>
                </tbody>
            </table>

            <div class="section-header">📜 TERMS & CONDITIONS</div>
            <div class="details-box" style="font-size: 8.5pt; white-space: pre-line;">
                {{quote.terms_conditions}}
                <br><br>
                <strong>Office Notes:</strong><br>
                {{quote.notes}}
            </div>

            <div style="margin-top: 30px; text-align: center; color: #d32f2f; font-style: italic; font-weight: bold;">
                (This is a computer-generated document. Signature not required)
                <br><small style="color:#888;">Every journey begins with trust.</small>
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

    async generatePDFBuffer(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ 
            format: 'A4', 
            printBackground: true 
        });
        await browser.close();
        return Buffer.from(pdf);
    }
};