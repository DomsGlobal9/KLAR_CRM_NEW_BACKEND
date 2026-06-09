// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';
// import fs from 'fs';
// import path from 'path';

// export const travelDocumentService = {
//     async generateTravelProposalHTML(itineraryData: any, quoteData: any): Promise<string> {
        
//         const hostedLogoUrl = 'https://travel-pdfs-prod-399934155938-eu-north-1-an.s3.eu-north-1.amazonaws.com/pdf/Frame%201000007152%202.png';

//         const logoHtmlTag = `<img src="${hostedLogoUrl}" style="max-height: 60px; display: block;" alt="KLAR TRAVELS" />`;

//         if (!handlebars.helpers['eq']) {
//             handlebars.registerHelper('eq', (a: any, b: any) => a === b);
//         }

//         if (!handlebars.helpers['formatDateTime']) {
//             handlebars.registerHelper('formatDateTime', (dateTimeStr: string) => {
//                 if (!dateTimeStr) return 'N/A';
//                 try {
//                     const date = new Date(dateTimeStr);
//                     return date.toLocaleDateString('en-IN', {
//                         day: '2-digit',
//                         month: 'short',
//                         year: 'numeric',
//                         hour: '2-digit',
//                         minute: '2-digit'
//                     });
//                 } catch (e) {
//                     return dateTimeStr;
//                 }
//             });
//         }

//         const templateHtml = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//             <style>
//                 @page { margin: 15mm; }
//                 body { 
//                     font-family: 'Segoe UI', 'Trebuchet MS', Tahoma, sans-serif; 
//                     color: #2c3e50; 
//                     margin: 0; 
//                     padding: 20px 0; 
//                     line-height: 1.5; 
//                     font-size: 9.5pt; 
//                     background-color: #f5f5f5;
//                 }
                
//                 /* Main center-aligned container wrapping the payload body securely */
//                 .document-container {
//                     max-width: 1000px;
//                     width: 100%;
//                     margin: 0 auto;
//                     background-color: #ffffff;
//                     padding: 30px;
//                     border-radius: 8px;
//                     box-shadow: 0 2px 10px rgba(0,0,0,0.08);
//                 }
                
//                 /* Bulletproof Table header structure for strict layout consistency */
//                 .header-table {
//                     width: 100%;
//                     border-collapse: collapse;
//                     border-spacing: 0;
//                     border-bottom: 2px solid #d32f2f;
//                     padding-bottom: 10px;
//                     margin-bottom: 20px;
//                 }
                
//                 .header-table td {
//                     vertical-align: middle;
//                     padding-bottom: 10px;
//                 }
                
//                 .logo-container {
//                     text-align: left;
//                 }
                
//                 .company-details { 
//                     text-align: right; 
//                     font-size: 8.5pt; 
//                     color: #444; 
//                     line-height: 1.4; 
//                 }
                
//                 .company-name { font-weight: 800; color: #4b0082; font-size: 15pt; letter-spacing: 0.5px; }
//                 .doc-title { text-align: center; color: #d32f2f; font-size: 19pt; text-decoration: underline; margin: 15px 0; font-weight: bold; letter-spacing: 1px; }
//                 .section-header { border-left: 5px solid #d32f2f; padding: 6px 12px; color: #4b0082; font-size: 12pt; font-weight: bold; margin: 22px 0 12px 0; background: #f5f5f5; text-transform: uppercase; letter-spacing: 0.5px; }
                
//                 /* Master Details container box */
//                 .details-box { border: 1px solid #b0b0b0; padding: 0; margin-bottom: 18px; border-radius: 4px; background: #fff; overflow: hidden; }
                
//                 /* Structured Grid Lines inside Itinerary Cards mimicking spreadsheet segments */
//                 .itinerary-grid { display: grid; grid-template-columns: 1fr 1fr; }
//                 .itinerary-grid div { 
//                     padding: 10px 14px; 
//                     border-bottom: 1px solid #e0e0e0;
//                     border-right: 1px solid #e0e0e0;
//                 }
//                 /* Remove double boundary outlines */
//                 .itinerary-grid div:nth-child(2n) { border-right: none; }
//                 .itinerary-grid div:last-child, .itinerary-grid div:nth-last-child(2):not(:nth-child(2n)) { border-bottom: none; }
                
//                 .grid-span-2 { grid-column: span 2; border-right: none !important; }
                
//                 p { margin: 0; padding: 0; }
//                 .field-label { color: #555; font-weight: 600; font-size: 9pt; display: inline-block; width: 110px; }
//                 .field-value { color: #111; font-weight: 500; }

//                 /* Commercial Quotation grid table styling */
//                 table.quotation-items-table { width: 100%; border-collapse: collapse; margin: 12px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
//                 th { background: #4b0082; color: white; border: 1px solid #9c7bb5; padding: 11px 10px; text-align: left; font-size: 9.5pt; font-weight: bold; letter-spacing: 0.5px; }
//                 td { border: 1px solid #b0b0b0; padding: 11px 10px; vertical-align: middle; font-size: 9pt; color: #222; }
                
//                 .total-row { background: #fff5f5; font-weight: bold; }
//                 .total-row td { border-top: 2px solid #4b0082; }
//                 .service-tag { background: #d32f2f; color: white; padding: 3px 10px; border-radius: 12px; font-size: 7.5pt; float: right; font-weight: bold; letter-spacing: 0.5px; margin-top: 10px; margin-right: 14px; }
//                 .card-title-bar { background: #fcfcfc; border-bottom: 1px solid #b0b0b0; padding: 2px 0; }
//                 .req-highlight { color: #d32f2f; font-weight: bold; padding: 10px 14px; background: #fff8f8; display: block; border-top: 1px dashed #b0b0b0; font-size: 9pt; }
//                 .page-break { page-break-after: always; }
                
//                 @media print {
//                     body {
//                         background: white;
//                         padding: 0;
//                     }
//                     .document-container {
//                         max-width: 100%;
//                         padding: 0;
//                         box-shadow: none;
//                         border-radius: 0;
//                     }
//                 }
//             </style>
//         </head>
//         <body>
            
//             <div class="document-container">
                
//                 <table class="header-table">
//                     <tr>
//                         <td class="logo-container" style="width: 50%;">
//                             ${logoHtmlTag}
//                         </td>
//                         <td class="company-details" style="width: 50%;">
//                             <div class="company-name">KLAR TRAVELS</div>
//                             #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
//                             HYDERABAD - 500 0073 | Tel: +914023745112, 42603413<br>
//                             Mob: +918099359377 | Email: praveentour1@gmail.com<br>
//                             <strong>GSTIN: 36BGCPS2420P1Z4</strong>
//                         </td>
//                     </tr>
//                 </table>

//                 <div class="doc-title">PROPOSAL & QUOTATION</div>

//                 <div class="details-box" style="padding: 14px;">
//                     <div class="itinerary-grid" style="grid-template-columns: 1.2fr 0.8fr;">
//                         <div style="border: none; padding: 0;">
//                             <p style="margin-bottom: 6px;"><span class="field-label" style="width: 90px;">Client Name:</span><span class="field-value" style="font-size: 10pt; font-weight: bold;">{{quote.client_name}}</span></p>
//                             <p style="margin-bottom: 6px;"><span class="field-label" style="width: 90px;">Contact:</span><span class="field-value">{{quote.client_phone}}</span></p>
//                             <p><span class="field-label" style="width: 90px;">Email:</span><span class="field-value">{{quote.client_email}}</span></p>
//                         </div>
//                         <div style="border: none; padding: 0; text-align: right;">
//                             <p style="margin-bottom: 6px;"><span class="field-label" style="text-align: left; width: 100px;">Quote No:</span><span class="field-value" style="font-weight: bold; color: #d32f2f;">{{quote.quote_number}}</span></p>
//                             <p style="margin-bottom: 6px;"><span class="field-label" style="text-align: left; width: 100px;">Date:</span><span class="field-value">{{date_formatted}}</span></p>
//                             <p><span class="field-label" style="text-align: left; width: 100px;">Lead Location:</span><span class="field-value">{{itinerary.lead_details.metadata.country_city}}</span></p>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="section-header">📍 ITINERARY & SERVICE PREFERENCES</div>

//                 {{#each itinerary.service_preferences}}
//                 <div class="details-box">
//                     <div class="card-title-bar">
//                         <span class="service-tag">{{service_type}}</span>
//                         <h3 style="margin: 10px 14px; color:#4b0082; font-size: 11pt; font-weight: 700;">{{title}}</h3>
//                     </div>
                    
//                     <div class="itinerary-grid">
//                         {{#if (eq service_type "TRANSFERS")}}
//                             <div><span class="field-label">Transfer Type:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.transfer_type}}</span></div>
//                             <div><span class="field-label">Vehicle Type:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.vehicle_type}}</span></div>
//                             <div><span class="field-label">Passengers:</span><span class="field-value">{{preferences.passengers}} Pax</span></div>
//                             <div><span class="field-label">Date & Time:</span><span class="field-value">{{formatDateTime preferences.transfer_date_time}}</span></div>
//                             <div class="grid-span-2"><span class="field-label">Pickup Point:</span><span class="field-value">{{preferences.pickup_location}}</span></div>
//                             <div class="grid-span-2"><span class="field-label">Drop Location:</span><span class="field-value">{{preferences.drop_location}}</span></div>
//                         {{/if}}

//                         {{#if (eq service_type "FLIGHTS")}}
//                             <div class="grid-span-2"><span class="field-label">Route Details:</span><span class="field-value">{{preferences.route}}</span></div>
//                             <div><span class="field-label">Airline Carrier:</span><span class="field-value">{{preferences.airline}}</span></div>
//                             <div><span class="field-label">Trip Type:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.trip_type}}</span></div>
//                             <div><span class="field-label">Cabin Class:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.cabin_class}}</span></div>
//                             <div><span class="field-label">Fare Type:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.fare_type}}</span></div>
//                             <div><span class="field-label">Departure Date:</span><span class="field-value">{{preferences.departure_date}}</span></div>
//                             <div><span class="field-label">Arrival Date:</span><span class="field-value">{{preferences.arrival_date}}</span></div>
//                         {{/if}}

//                         {{#if (eq service_type "HOTELS")}}
//                             <div class="grid-span-2"><span class="field-label">Hotel Name:</span><span class="field-value" style="font-weight: bold; color: #4b0082;">{{preferences.hotel_name}}</span></div>
//                             <div class="grid-span-2"><span class="field-label">Location/Area:</span><span class="field-value">{{preferences.location}}</span></div>
//                             <div><span class="field-label">Room Type:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.room_type}}</span></div>
//                             <div><span class="field-label">Stay Configuration:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.stay_type}}</span></div>
//                             <div><span class="field-label">Meal Option:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.meal_plan}}</span></div>
//                             <div><span class="field-label">Hotel Category:</span><span class="field-value">{{preferences.hotel_category}}</span></div>
//                             <div><span class="field-label">Check-In Date:</span><span class="field-value">{{preferences.check_in_date}}</span></div>
//                             <div><span class="field-label">Check-Out Date:</span><span class="field-value">{{preferences.check_out_date}}</span></div>
//                         {{/if}}

//                         {{#if (eq service_type "TOUR_PACKAGES")}}
//                             <div><span class="field-label">Tour Option:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.tour_type}}</span></div>
//                             <div><span class="field-label">Total Duration:</span><span class="field-value">{{preferences.duration}} Days</span></div>
//                             <div class="grid-span-2"><span class="field-label">Destination:</span><span class="field-value">{{preferences.destination}}</span></div>
//                             <div class="grid-span-2"><span class="field-label">Inclusions:</span><span class="field-value" style="color: #27ae60; font-weight: 600;">{{preferences.inclusions}}</span></div>
//                             <div><span class="field-label">Start Date:</span><span class="field-value">{{preferences.tour_start_date}}</span></div>
//                             <div><span class="field-label">End Date:</span><span class="field-value">{{preferences.tour_end_date}}</span></div>
//                         {{/if}}

//                         {{#if (eq service_type "CHARTER_SERVICES")}}
//                             <div><span class="field-label">Aircraft Type:</span><span class="field-value">{{preferences.aircraft_type}}</span></div>
//                             <div><span class="field-label">Pax Capacity:</span><span class="field-value">{{preferences.passenger_capacity}} seats</span></div>
//                             <div class="grid-span-2"><span class="field-label">Sector Ports:</span><span class="field-value">{{preferences.departure_port}} to {{preferences.arrival_port}}</span></div>
//                             <div><span class="field-label">Flight Duration:</span><span class="field-value">{{preferences.flight_duration}}</span></div>
//                             <div><span class="field-label">Catering Plan:</span><span class="field-value">{{preferences.catering_services}}</span></div>
//                             <div><span class="field-label">Schedule Start:</span><span class="field-value">{{preferences.charter_start}}</span></div>
//                             <div><span class="field-label">Schedule End:</span><span class="field-value">{{preferences.charter_end}}</span></div>
//                         {{/if}}

//                         {{#if (eq service_type "YACHT_CHARTER")}}
//                             <div><span class="field-label">Yacht Build:</span><span class="field-value">{{preferences.yacht_type}}</span></div>
//                             <div><span class="field-label">Cruise Duration:</span><span class="field-value">{{preferences.charter_duration}}</span></div>
//                             <div class="grid-span-2"><span class="field-label">Route Portals:</span><span class="field-value">{{preferences.departure_port}} to {{preferences.arrival_port}}</span></div>
//                             <div class="grid-span-2"><span class="field-label">Yacht Amenities:</span><span class="field-value">{{preferences.yacht_amenities}}</span></div>
//                             <div class="grid-span-2"><span class="field-label">Onboard Crew:</span><span class="field-value">{{preferences.crew_services}}</span></div>
//                         {{/if}}

//                         {{#if (eq service_type "EVENT_MANAGEMENT")}}
//                             <div><span class="field-label">Event Variant:</span><span class="field-value">{{preferences.event_type}}</span></div>
//                             <div><span class="field-label">Planned Date:</span><span class="field-value">{{preferences.event_date}}</span></div>
//                             <div class="grid-span-2"><span class="field-label">Target Venue:</span><span class="field-value">{{preferences.venue}}</span></div>
//                             <div><span class="field-label">Expected Pax:</span><span class="field-value">{{preferences.attendees}} Visitors</span></div>
//                             <div><span class="field-label">Services:</span><span class="field-value">{{preferences.services_required}}</span></div>
//                         {{/if}}

//                         {{#if (eq service_type "VISA_SERVICES")}}
//                             <div><span class="field-label">Visa Category:</span><span class="field-value">{{preferences.visa_type}}</span></div>
//                             <div><span class="field-label">Processing Time:</span><span class="field-value">{{preferences.processing_time}}</span></div>
//                             <div class="grid-span-2"><span class="field-label">Document Setup:</span><span class="field-value">{{preferences.document_checklist}}</span></div>
//                         {{/if}}
//                     </div>

//                     {{#if preferences.special_requirements}}
//                         <span class="req-highlight">⚠️ SPECIAL REQUIREMENTS: {{preferences.special_requirements}}</span>
//                     {{/if}}
//                     {{#if preferences.notes}}
//                         <div style="padding: 10px 14px; background: #fafafa; border-top: 1px solid #e0e0e0; font-size: 9pt;">
//                             <strong>Itinerary Notes:</strong> {{preferences.notes}}
//                         </div>
//                     {{/if}}
//                 </div>
//                 {{/each}}

//                 <div class="page-break"></div>

//                 <div class="section-header">💰 COMMERCIAL QUOTATION</div>
//                 <table class="quotation-items-table">
//                     <thead>
//                         <tr>
//                             <th>DESCRIPTION OF SERVICES</th>
//                             <th style="text-align:center; width: 10%;">QTY</th>
//                             <th style="text-align:right; width: 22%;">UNIT COST ({{quote.currency}})</th>
//                             <th style="text-align:right; width: 22%;">TOTAL ({{quote.currency}})</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {{#each quote.line_items}}
//                         <tr>
//                             <td>
//                                 <strong style="color: #4b0082; font-size: 9.5pt;">{{this.description}}</strong><br>
//                                 <small style="color:#555; margin-top: 4px; display: inline-block; line-height: 1.3;">
//                                     {{#if this.details.baseFare}} Flight Fare: ₹{{this.details.baseFare}} | {{/if}}
//                                     {{#if this.details.roomCharges}} Room Cost: ₹{{this.details.roomCharges}} | {{/if}}
//                                     {{#if this.details.vehicleCost}} Transport Base: ₹{{this.details.vehicleCost}} | {{/if}}
//                                     {{#if this.details.driverAllowance}} Driver Allowance: ₹{{this.details.driverAllowance}} | {{/if}}
//                                     {{#if this.details.tollParking}} Toll/Parking: ₹{{this.details.tollParking}} | {{/if}}
//                                     {{#each this.details.categories}}
//                                         {{category_name}}: {{#each sub_services}}{{sub_service_name}}{{/each}} |
//                                     {{/each}}
//                                     {{#if this.details.exclusions}}<br><span style="color: #c0392b;">Exclusions: {{this.details.exclusions}}</span>{{/if}}
//                                 </small>
//                             </td>
//                             <td style="text-align:center; font-weight: bold;">{{this.quantity}}</td>
//                             <td style="text-align:right; font-weight: 500;">{{this.unit_price}}</td>
//                             <td style="text-align:right; font-weight: bold;">
//                                 {{#if this.total_price}}{{this.total_price}}{{else}}{{this.total}}{{/if}}
//                             </td>
//                         </tr>
//                         {{/each}}
//                         <tr class="total-row">
//                             <td colspan="3" style="text-align:right; font-weight: bold; letter-spacing: 0.5px;">SUBTOTAL</td>
//                             <td style="text-align:right; font-weight: bold; color: #111;">{{quote.subtotal}}</td>
//                         </tr>
//                         <tr>
//                             <td colspan="3" style="text-align:right; font-weight: 600; color: #555;">GST / TAX DETAILS</td>
//                             <td style="text-align:right; font-weight: 600; color: #555;">{{quote.tax_amount}}</td>
//                         </tr>
//                         <tr class="total-row" style="color: #d32f2f; font-size: 12pt; background: #fdf2f2;">
//                             <td colspan="3" style="text-align:right; font-weight: bold; letter-spacing: 0.5px;">NET PAYABLE AMOUNT</td>
//                             <td style="text-align:right; font-weight: 900;">{{quote.currency}} {{quote.final_amount}}</td>
//                         </tr>
//                     </tbody>
//                 </table>

//                 <div class="section-header">📜 TERMS & CONDITIONS</div>
//                 <div class="details-box" style="font-size: 8.5pt; white-space: pre-line; padding: 14px; line-height: 1.5; color: #444;">
//                     {{#if quote.terms_conditions}}
//                         {{quote.terms_conditions}}
//                     {{else}}
//                         1. All rates provided are subject to availability at the actual time of confirmation booking sequence.<br>
//                         2. Dynamic standard airline pricing or hotel block changes are directly governed by the respective operational carrier rules.<br>
//                         3. Standard cancellation timelines and processing rules apply as mapped by platform updates.
//                     {{/if}}
//                     {{#if quote.notes}}
//                     <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #b0b0b0; color: #111;">
//                         <strong>Office Internal Notes:</strong><br>
//                         <span style="font-family: monospace; color: #555;">{{quote.notes}}</span>
//                     </div>
//                     {{/if}}
//                 </div>

//                 <div style="margin-top: 35px; text-align: center; color: #d32f2f; font-style: italic; font-weight: bold; font-size: 9.5pt;">
//                     (This is a computer-generated document. Signature not required)
//                     <br><small style="color:#777; font-weight: normal; font-size: 8pt; margin-top: 4px; display: inline-block;">Every journey begins with trust.</small>
//                 </div>
                
//             </div>
//         </body>
//         </html>
//         `;

//         const template = handlebars.compile(templateHtml);
//         return template({
//             itinerary: itineraryData,
//             quote: quoteData,
//             logoHtmlTag,
//             date_formatted: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
//         });
//     },

//     async generatePDFBuffer(html: string): Promise<Buffer> {
//         const browser = await puppeteer.launch({ 
//             headless: true, 
//             args: [
//                 '--no-sandbox', 
//                 '--disable-setuid-sandbox',
//                 '--disable-dev-shm-usage',
//                 '--disable-accelerated-2d-canvas',
//                 '--disable-gpu'
//             ] 
//         });
//         const page = await browser.newPage();
        
//         // Fixed: Using type assertion to handle the 'networkidle0' option
//         await page.setContent(html, { waitUntil: 'networkidle0' as any });
        
//         const pdf = await page.pdf({ 
//             format: 'A4', 
//             printBackground: true,
//             margin: {
//                 top: '15mm',
//                 bottom: '15mm',
//                 left: '15mm',
//                 right: '15mm'
//             }
//         });
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
        console.log("8 itinerary-quotePdf.ts- PDF Generation Data:", { itineraryData: JSON.stringify(itineraryData), quoteData: JSON.stringify(quoteData) });
        
        const hostedLogoUrl = 'https://travel-pdfs-prod-399934155938-eu-north-1-an.s3.eu-north-1.amazonaws.com/pdf/Frame%201000007152%202.png';

        const logoHtmlTag = `<img src="${hostedLogoUrl}" style="max-height: 60px; display: block;" alt="KLAR TRAVELS" />`;

        if (!handlebars.helpers['eq']) {
            handlebars.registerHelper('eq', (a: any, b: any) => a === b);
        }

        if (!handlebars.helpers['formatDateTime']) {
            handlebars.registerHelper('formatDateTime', (dateTimeStr: string) => {
                if (!dateTimeStr) return 'N/A';
                try {
                    const date = new Date(dateTimeStr);
                    return date.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch (e) {
                    return dateTimeStr;
                }
            });
        }

        const templateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { margin: 15mm; }
                body { 
                    font-family: 'Segoe UI', 'Trebuchet MS', Tahoma, sans-serif; 
                    color: #2c3e50; 
                    margin: 0; 
                    padding: 20px 0; 
                    line-height: 1.5; 
                    font-size: 9.5pt; 
                    background-color: #f5f5f5;
                }
                
                /* Main center-aligned container wrapping the payload body securely */
                .document-container {
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
                
                .company-details { 
                    text-align: right; 
                    font-size: 8.5pt; 
                    color: #444; 
                    line-height: 1.4; 
                }
                
                .company-name { font-weight: 800; color: #4b0082; font-size: 15pt; letter-spacing: 0.5px; }
                .doc-title { text-align: center; color: #d32f2f; font-size: 19pt; text-decoration: underline; margin: 15px 0; font-weight: bold; letter-spacing: 1px; }
                .section-header { border-left: 5px solid #d32f2f; padding: 6px 12px; color: #4b0082; font-size: 12pt; font-weight: bold; margin: 22px 0 12px 0; background: #f5f5f5; text-transform: uppercase; letter-spacing: 0.5px; }
                
                /* Master Details container box */
                .details-box { border: 1px solid #b0b0b0; padding: 0; margin-bottom: 18px; border-radius: 4px; background: #fff; overflow: hidden; }
                
                /* Balanced table structure inside client metadata box */
                .metadata-table {
                    width: 100%;
                    border-collapse: collapse;
                    border-spacing: 0;
                }
                
                .metadata-table td {
                    border: none !important;
                    padding: 0 !important;
                    vertical-align: top;
                }
                
                /* Structured Grid Lines inside Itinerary Cards mimicking spreadsheet segments */
                .itinerary-grid { display: grid; grid-template-columns: 1fr 1fr; }
                .itinerary-grid div { 
                    padding: 10px 14px; 
                    border-bottom: 1px solid #e0e0e0;
                    border-right: 1px solid #e0e0e0;
                }
                /* Remove double boundary outlines */
                .itinerary-grid div:nth-child(2n) { border-right: none; }
                .itinerary-grid div:last-child, .itinerary-grid div:nth-last-child(2):not(:nth-child(2n)) { border-bottom: none; }
                
                .grid-span-2 { grid-column: span 2; border-right: none !important; }
                
                p { margin: 0; padding: 0; }
                .field-label { color: #555; font-weight: 600; font-size: 9pt; display: inline-block; width: 110px; }
                .field-value { color: #111; font-weight: 500; }

                /* Commercial Quotation grid table styling */
                table.quotation-items-table { width: 100%; border-collapse: collapse; margin: 12px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                th { background: #4b0082; color: white; border: 1px solid #9c7bb5; padding: 11px 10px; text-align: left; font-size: 9.5pt; font-weight: bold; letter-spacing: 0.5px; }
                td { border: 1px solid #b0b0b0; padding: 11px 10px; vertical-align: middle; font-size: 9pt; color: #222; }
                
                .total-row { background: #fff5f5; font-weight: bold; }
                .total-row td { border-top: 2px solid #4b0082; }
                .service-tag { background: #d32f2f; color: white; padding: 3px 10px; border-radius: 12px; font-size: 7.5pt; float: right; font-weight: bold; letter-spacing: 0.5px; margin-top: 10px; margin-right: 14px; }
                .card-title-bar { background: #fcfcfc; border-bottom: 1px solid #b0b0b0; padding: 2px 0; }
                .req-highlight { color: #d32f2f; font-weight: bold; padding: 10px 14px; background: #fff8f8; display: block; border-top: 1px dashed #b0b0b0; font-size: 9pt; }
                .page-break { page-break-after: always; }
                
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    .document-container {
                        max-width: 100%;
                        padding: 0;
                        box-shadow: none;
                        border-radius: 0;
                    }
                }
            </style>
        </head>
        <body>
            
            <div class="document-container">
                
                <table class="header-table">
                    <tr>
                        <td class="logo-container" style="width: 50%;">
                            {{{logoHtmlTag}}}
                        </td>
                        <td class="company-details" style="width: 50%;">
                            <div class="company-name">KLAR TRAVELS</div>
                            #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
                            HYDERABAD - 500 0073 | Tel: +914023745112, 42603413<br>
                            Mob: +918099359377 | Email: praveentour1@gmail.com<br>
                            <strong>GSTIN: 36BGCPS2420P1Z4</strong>
                        </td>
                    </tr>
                </table>

                <div class="doc-title">PROPOSAL & QUOTATION</div>

                <div class="details-box" style="padding: 14px;">
                    <table class="metadata-table">
                        <tr>
                            <td style="width: 55%;">
                                <p style="margin-bottom: 6px;"><span class="field-label" style="width: 90px;">Client Name:</span><span class="field-value" style="font-size: 10pt; font-weight: bold;">{{quote.client_name}}</span></p>
                                <p style="margin-bottom: 6px;"><span class="field-label" style="width: 90px;">Contact:</span><span class="field-value">{{quote.client_phone}}</span></p>
                                <p><span class="field-label" style="width: 90px;">Email:</span><span class="field-value">{{quote.client_email}}</span></p>
                            </td>
                            <td style="width: 45%; text-align: right;">
                                <p style="margin-bottom: 6px;"><span class="field-label" style="text-align: left; width: 100px;">Quote No:</span><span class="field-value" style="font-weight: bold; color: #d32f2f;">{{quote.quote_number}}</span></p>
                                <p style="margin-bottom: 6px;"><span class="field-label" style="text-align: left; width: 100px;">Date:</span><span class="field-value">{{date_formatted}}</span></p>
                                <p><span class="field-label" style="text-align: left; width: 100px;">Lead Location:</span><span class="field-value">{{itinerary.lead_details.metadata.country_city}}</span></p>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="section-header">📍 ITINERARY & SERVICE PREFERENCES</div>

                {{#each itinerary.service_preferences}}
                <div class="details-box">
                    <div class="card-title-bar">
                        <span class="service-tag">{{service_type}}</span>
                        <h3 style="margin: 10px 14px; color:#4b0082; font-size: 11pt; font-weight: 700;">{{title}}</h3>
                    </div>
                    
                    <div class="itinerary-grid">
                        {{#if (eq service_type "TRANSFERS")}}
                            <div><span class="field-label">Transfer Type:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.transfer_type}}</span></div>
                            <div><span class="field-label">Vehicle Type:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.vehicle_type}}</span></div>
                            <div><span class="field-label">Passengers:</span><span class="field-value">{{preferences.passengers}} Pax</span></div>
                            <div><span class="field-label">Date & Time:</span><span class="field-value">{{formatDateTime preferences.transfer_date_time}}</span></div>
                            <div class="grid-span-2"><span class="field-label">Pickup Point:</span><span class="field-value">{{preferences.pickup_location}}</span></div>
                            <div class="grid-span-2"><span class="field-label">Drop Location:</span><span class="field-value">{{preferences.drop_location}}</span></div>
                        {{/if}}

                        {{#if (eq service_type "FLIGHTS")}}
                            <div class="grid-span-2"><span class="field-label">Route Details:</span><span class="field-value">{{preferences.route}}</span></div>
                            <div><span class="field-label">Airline Carrier:</span><span class="field-value">{{preferences.airline}}</span></div>
                            <div><span class="field-label">Trip Type:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.trip_type}}</span></div>
                            <div><span class="field-label">Cabin Class:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.cabin_class}}</span></div>
                            <div><span class="field-label">Fare Type:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.fare_type}}</span></div>
                            <div><span class="field-label">Departure Date:</span><span class="field-value">{{preferences.departure_date}}</span></div>
                            <div><span class="field-label">Arrival Date:</span><span class="field-value">{{preferences.arrival_date}}</span></div>
                        {{/if}}

                        {{#if (eq service_type "HOTELS")}}
                            <div class="grid-span-2"><span class="field-label">Hotel Name:</span><span class="field-value" style="font-weight: bold; color: #4b0082;">{{preferences.hotel_name}}</span></div>
                            <div class="grid-span-2"><span class="field-label">Location/Area:</span><span class="field-value">{{preferences.location}}</span></div>
                            <div><span class="field-label">Room Type:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.room_type}}</span></div>
                            <div><span class="field-label">Stay Configuration:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.stay_type}}</span></div>
                            <div><span class="field-label">Meal Option:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.meal_plan}}</span></div>
                            <div><span class="field-label">Hotel Category:</span><span class="field-value">{{preferences.hotel_category}}</span></div>
                            <div><span class="field-label">Check-In Date:</span><span class="field-value">{{preferences.check_in_date}}</span></div>
                            <div><span class="field-label">Check-Out Date:</span><span class="field-value">{{preferences.check_out_date}}</span></div>
                        {{/if}}

                        {{#if (eq service_type "TOUR_PACKAGES")}}
                            <div><span class="field-label">Tour Option:</span><span class="field-value" style="text-transform: capitalize;">{{preferences.tour_type}}</span></div>
                            <div><span class="field-label">Total Duration:</span><span class="field-value">{{preferences.duration}} Days</span></div>
                            <div class="grid-span-2"><span class="field-label">Destination:</span><span class="field-value">{{preferences.destination}}</span></div>
                            <div class="grid-span-2"><span class="field-label">Inclusions:</span><span class="field-value" style="color: #27ae60; font-weight: 600;">{{preferences.inclusions}}</span></div>
                            <div><span class="field-label">Start Date:</span><span class="field-value">{{preferences.tour_start_date}}</span></div>
                            <div><span class="field-label">End Date:</span><span class="field-value">{{preferences.tour_end_date}}</span></div>
                        {{/if}}

                        {{#if (eq service_type "CHARTER_SERVICES")}}
                            <div><span class="field-label">Aircraft Type:</span><span class="field-value">{{preferences.aircraft_type}}</span></div>
                            <div><span class="field-label">Pax Capacity:</span><span class="field-value">{{preferences.passenger_capacity}} seats</span></div>
                            <div class="grid-span-2"><span class="field-label">Sector Ports:</span><span class="field-value">{{preferences.departure_port}} to {{preferences.arrival_port}}</span></div>
                            <div><span class="field-label">Flight Duration:</span><span class="field-value">{{preferences.flight_duration}}</span></div>
                            <div><span class="field-label">Catering Plan:</span><span class="field-value">{{preferences.catering_services}}</span></div>
                            <div><span class="field-label">Schedule Start:</span><span class="field-value">{{preferences.charter_start}}</span></div>
                            <div><span class="field-label">Schedule End:</span><span class="field-value">{{preferences.charter_end}}</span></div>
                        {{/if}}

                        {{#if (eq service_type "YACHT_CHARTER")}}
                            <div><span class="field-label">Yacht Build:</span><span class="field-value">{{preferences.yacht_type}}</span></div>
                            <div><span class="field-label">Cruise Duration:</span><span class="field-value">{{preferences.charter_duration}}</span></div>
                            <div class="grid-span-2"><span class="field-label">Route Portals:</span><span class="field-value">{{preferences.departure_port}} to {{preferences.arrival_port}}</span></div>
                            <div class="grid-span-2"><span class="field-label">Yacht Amenities:</span><span class="field-value">{{preferences.yacht_amenities}}</span></div>
                            <div class="grid-span-2"><span class="field-label">Onboard Crew:</span><span class="field-value">{{preferences.crew_services}}</span></div>
                        {{/if}}

                        {{#if (eq service_type "EVENT_MANAGEMENT")}}
                            <div><span class="field-label">Event Variant:</span><span class="field-value">{{preferences.event_type}}</span></div>
                            <div><span class="field-label">Planned Date:</span><span class="field-value">{{preferences.event_date}}</span></div>
                            <div class="grid-span-2"><span class="field-label">Target Venue:</span><span class="field-value">{{preferences.venue}}</span></div>
                            <div><span class="field-label">Expected Pax:</span><span class="field-value">{{preferences.attendees}} Visitors</span></div>
                            <div><span class="field-label">Services:</span><span class="field-value">{{preferences.services_required}}</span></div>
                        {{/if}}

                        {{#if (eq service_type "VISA_SERVICES")}}
                            <div><span class="field-label">Visa Category:</span><span class="field-value">{{preferences.visa_type}}</span></div>
                            <div><span class="field-label">Processing Time:</span><span class="field-value">{{preferences.processing_time}}</span></div>
                            <div class="grid-span-2"><span class="field-label">Document Setup:</span><span class="field-value">{{preferences.document_checklist}}</span></div>
                        {{/if}}
                    </div>

                    {{#if preferences.special_requirements}}
                        <span class="req-highlight">⚠️ SPECIAL REQUIREMENTS: {{preferences.special_requirements}}</span>
                    {{/if}}
                    {{#if preferences.notes}}
                        <div style="padding: 10px 14px; background: #fafafa; border-top: 1px solid #e0e0e0; font-size: 9pt;">
                            <strong>Itinerary Notes:</strong> {{preferences.notes}}
                        </div>
                    {{/if}}
                </div>
                {{/each}}

                <div class="page-break"></div>

                <div class="section-header">💰 COMMERCIAL QUOTATION</div>
                <table class="quotation-items-table">
                    <thead>
                        <tr>
                            <th>DESCRIPTION OF SERVICES</th>
                            <th style="text-align:center; width: 10%;">QTY</th>
                            <th style="text-align:right; width: 22%;">UNIT COST ({{quote.currency}})</th>
                            <th style="text-align:right; width: 22%;">TOTAL ({{quote.currency}})</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each quote.line_items}}
                        <tr>
                            <td>
                                <strong style="color: #4b0082; font-size: 9.5pt;">{{this.description}}</strong><br>
                                <small style="color:#555; margin-top: 4px; display: inline-block; line-height: 1.3;">
                                    {{#if this.details.baseFare}} Flight Fare: ₹{{this.details.baseFare}} | {{/if}}
                                    {{#if this.details.roomCharges}} Room Cost: ₹{{this.details.roomCharges}} | {{/if}}
                                    {{#if this.details.vehicleCost}} Transport Base: ₹{{this.details.vehicleCost}} | {{/if}}
                                    {{#if this.details.driverAllowance}} Driver Allowance: ₹{{this.details.driverAllowance}} | {{/if}}
                                    {{#if this.details.tollParking}} Toll/Parking: ₹{{this.details.tollParking}} | {{/if}}
                                    {{#each this.details.categories}}
                                        {{category_name}}: {{#each sub_services}}{{sub_service_name}}{{/each}} |
                                    {{/each}}
                                    {{#if this.details.exclusions}}<br><span style="color: #c0392b;">Exclusions: {{this.details.exclusions}}</span>{{/if}}
                                </small>
                            </td>
                            <td style="text-align:center; font-weight: bold;">{{this.quantity}}</td>
                            <td style="text-align:right; font-weight: 500;">{{this.unit_price}}</td>
                            <td style="text-align:right; font-weight: bold;">
                                {{#if this.total_price}}{{this.total_price}}{{else}}{{this.total}}{{/if}}
                            </td>
                        </tr>
                        {{/each}}
                        <tr class="total-row">
                            <td colspan="3" style="text-align:right; font-weight: bold; letter-spacing: 0.5px;">SUBTOTAL</td>
                            <td style="text-align:right; font-weight: bold; color: #111;">{{quote.subtotal}}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align:right; font-weight: 600; color: #555;">GST / TAX DETAILS</td>
                            <td style="text-align:right; font-weight: 600; color: #555;">{{quote.tax_amount}}</td>
                        </tr>
                        <tr class="total-row" style="color: #d32f2f; font-size: 12pt; background: #fdf2f2;">
                            <td colspan="3" style="text-align:right; font-weight: bold; letter-spacing: 0.5px;">NET PAYABLE AMOUNT</td>
                            <td style="text-align:right; font-weight: 900;">{{quote.currency}} {{quote.final_amount}}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="section-header">📜 TERMS & CONDITIONS</div>
                <div class="details-box" style="font-size: 8.5pt; white-space: pre-line; padding: 14px; line-height: 1.5; color: #444;">
                    {{#if quote.terms_conditions}}
                        {{quote.terms_conditions}}
                    {{else}}
                        1. All rates provided are subject to availability at the actual time of confirmation booking sequence.<br>
                        2. Dynamic standard airline pricing or hotel block changes are directly governed by the respective operational carrier rules.<br>
                        3. Standard cancellation timelines and processing rules apply as mapped by platform updates.
                    {{/if}}
                    {{#if quote.notes}}
                    <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #b0b0b0; color: #111;">
                        <strong>Office Internal Notes:</strong><br>
                        <span style="font-family: monospace; color: #555;">{{quote.notes}}</span>
                    </div>
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

        const template = handlebars.compile(templateHtml);
        return template({
            itinerary: itineraryData,
            quote: quoteData,
            logoHtmlTag,
            date_formatted: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        });
    },

    async generatePDFBuffer(html: string): Promise<Buffer> {
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