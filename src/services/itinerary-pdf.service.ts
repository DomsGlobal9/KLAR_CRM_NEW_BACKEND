// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';
// import fs from 'fs';
// import path from 'path';

// export const itineraryPdfService = {
//     async generateHTML(itinerary: any): Promise<string> {
//         const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
//         let base64Logo = '';
//         try {
//             const bitmap = fs.readFileSync(logoPath);
//             base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
//         } catch (e) { console.error("Logo missing"); }

//         handlebars.registerHelper('eq', (a, b) => a === b);

//         const templateHtml = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//             <style>
//                 @page { margin: 15mm; }
//                 body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 0; line-height: 1.4; }
//                 .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; }
//                 .company-details { text-align: right; font-size: 8pt; color: #444; }
//                 .company-name { font-weight: bold; color: #4b0082; font-size: 14pt; }
//                 .doc-title { text-align: center; color: #d32f2f; font-size: 20pt; margin: 20px 0; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 10px; }
//                 .section-header { background: #4b0082; color: white; padding: 8px 15px; border-radius: 4px; font-size: 12pt; margin: 20px 0 10px; }
//                 .details-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
//                 .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
//                 .label { font-weight: bold; color: #666; }
//             </style>
//         </head>
//         <body>
//             <div class="header">
//                 <img src="${base64Logo}" style="max-height: 60px;" />
//                 <div class="company-details">
//                     <div class="company-name">KLAR TRAVELS</div>
//                     #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
//                     HYDERABAD - 500 0073 | Mob: +918099359377<br>
//                     GSTIN: 36BGCPS2420P1Z4
//                 </div>
//             </div>

//             <div class="doc-title">TRAVEL ITINERARY</div>

//             <div class="details-box">
//                 <div class="grid">
//                     <div><strong>Traveler:</strong> {{itinerary.lead_details.name}}</div>
//                     <div style="text-align: right;"><strong>Email:</strong> {{itinerary.lead_details.email}}</div>
//                     <div><strong>Contact:</strong> {{itinerary.lead_details.phone}}</div>
//                     <div style="text-align: right;"><strong>Origin:</strong> {{itinerary.lead_details.metadata.country_city}}</div>
//                 </div>
//             </div>

//             <div class="section-header">SERVICE DETAILS</div>
//             {{#each itinerary.service_preferences}}
//             <div class="details-box">
//                 <h3 style="margin:0; color:#d32f2f;">{{title}}</h3>
//                 <p>{{description}}</p>
//                 <div class="grid">
//                     {{#if (eq service_type "TOUR_PACKAGES")}}
//                         <p><span class="label">Destination:</span> {{preferences.destination}}</p>
//                         <p><span class="label">Duration:</span> {{preferences.duration}} Days</p>
//                         <p><span class="label">Dates:</span> {{preferences.tour_start_date}} to {{preferences.tour_end_date}}</p>
//                     {{/if}}
//                     {{#if (eq service_type "CHARTER_SERVICES")}}
//                         <p><span class="label">Aircraft:</span> {{preferences.aircraft_type}}</p>
//                         <p><span class="label">Route:</span> {{preferences.departure_port}} ➔ {{preferences.arrival_port}}</p>
//                     {{/if}}
//                 </div>
//                 {{#if preferences.special_requirements}}
//                 <p style="color: #d32f2f;"><strong>Special Requirements:</strong> {{preferences.special_requirements}}</p>
//                 {{/if}}
//             </div>
//             {{/each}}
//         </body>
//         </html>`;

//         const template = handlebars.compile(templateHtml);
//         return template({ itinerary });
//     },

//     async generateBuffer(html: string): Promise<Buffer> {
//         const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
//         const page = await browser.newPage();
//         await page.setContent(html, { waitUntil: 'networkidle0' });
//         const pdf = await page.pdf({ format: 'A4', printBackground: true });
//         await browser.close();
//         return Buffer.from(pdf);
//     }
// };















// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';
// import fs from 'fs';
// import path from 'path';

// export const itineraryPdfService = {
//     async generateHTML(itineraryData: any): Promise<string> {
//         const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
//         let base64Logo = '';
//         try {
//             const bitmap = fs.readFileSync(logoPath);
//             base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
//         } catch (e) { console.error("Logo missing"); }

//         handlebars.registerHelper('eq', (a, b) => a === b);

//         const templateHtml = `
//         <!DOCTYPE html>
//         <html>
//         <head>
//             <style>
//                 @page { margin: 15mm; }
//                 body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 0; line-height: 1.5; font-size: 10pt; }
//                 .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; }
//                 .company-details { text-align: right; font-size: 8pt; color: #444; }
//                 .company-name { font-weight: bold; color: #4b0082; font-size: 14pt; }
//                 .doc-title { text-align: center; color: #d32f2f; font-size: 18pt; margin: 20px 0; font-weight: bold; text-decoration: underline; }
//                 .section-header { border-left: 5px solid #d32f2f; padding-left: 10px; color: #4b0082; font-size: 12pt; font-weight: bold; margin: 20px 0 10px; background: #f9f9f9; }
//                 .details-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
//                 .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
//                 .service-badge { background: #d32f2f; color: white; padding: 2px 8px; border-radius: 10px; font-size: 8pt; float: right; }
//                 .page-break { page-break-after: always; }
//             </style>
//         </head>
//         <body>
//             <div class="header">
//                 <img src="${base64Logo}" style="max-height: 60px;" />
//                 <div class="company-details">
//                     <div class="company-name">KLAR TRAVELS</div>
//                     #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
//                     HYDERABAD - 500 0073 | Mob: +918099359377 | GSTIN: 36BGCPS2420P1Z4
//                 </div>
//             </div>

//             <div class="doc-title">TRAVEL ITINERARY PROPOSAL</div>

//             <div class="details-box">
//                 <div class="grid">
//                     <div>
//                         <p><strong>Traveler:</strong> {{lead_details.name}}</p>
//                         <p><strong>Email:</strong> {{lead_details.email}}</p>
//                     </div>
//                     <div style="text-align: right;">
//                         <p><strong>Origin:</strong> {{lead_details.metadata.country_city}}</p>
//                         <p><strong>Date:</strong> {{today}}</p>
//                     </div>
//                 </div>
//             </div>

//             <div class="section-header">📍 JOURNEY DETAILS</div>
//             {{#each service_preferences}}
//             <div class="details-box">
//                 <span class="service-badge">{{service_type}}</span>
//                 <h3 style="margin:0 0 10px 0;">{{title}}</h3>
//                 <p><i>{{description}}</i></p>

//                 <div class="grid">
//                     {{#if (eq service_type "CHARTER_SERVICES")}}
//                         <p><strong>Aircraft:</strong> {{preferences.aircraft_type}}</p>
//                         <p><strong>Route:</strong> {{preferences.departure_port}} to {{preferences.arrival_port}}</p>
//                         <p><strong>Capacity:</strong> {{preferences.passenger_capacity}} ({{preferences.guests}} Guests)</p>
//                         <p><strong>Catering:</strong> {{preferences.catering_services}}</p>
//                     {{/if}}

//                     {{#if (eq service_type "YACHT_CHARTER")}}
//                         <p><strong>Yacht:</strong> {{preferences.yacht_type}}</p>
//                         <p><strong>Duration:</strong> {{preferences.charter_duration}}</p>
//                         <p><strong>Departure:</strong> {{preferences.departure_port}}</p>
//                         <p><strong>Amenities:</strong> {{preferences.yacht_amenities}}</p>
//                     {{/if}}

//                     {{#if (eq service_type "TOUR_PACKAGES")}}
//                         <p><strong>Tour Type:</strong> {{preferences.tour_type}}</p>
//                         <p><strong>Destination:</strong> {{preferences.destination}}</p>
//                         <p><strong>Duration:</strong> {{preferences.duration}} Days</p>
//                         <p><strong>Inclusions:</strong> {{preferences.inclusions}}</p>
//                     {{/if}}
//                 </div>
//                 {{#if preferences.special_requirements}}
//                     <p style="color:#d32f2f; margin-top:10px;"><strong>Requirements:</strong> {{preferences.special_requirements}}</p>
//                 {{/if}}
//             </div>
//             {{/each}}

//             <div style="text-align: center; margin-top: 50px; font-style: italic;">Every journey begins with trust.</div>
//         </body>
//         </html>
//         `;

//         return handlebars.compile(templateHtml)({
//             ...itineraryData,
//             today: new Date().toLocaleDateString('en-IN')
//         });
//     },

//     async generateBuffer(html: string): Promise<Buffer> {
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

export const itineraryPdfService = {
    async generateHTML(itineraryData: any): Promise<string> {
        const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
        let base64Logo = '';
        try {
            const bitmap = fs.readFileSync(logoPath);
            base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
        } catch (e) { console.error("Logo missing"); }

        handlebars.registerHelper('eq', (a, b) => a === b);

        const templateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { margin: 15mm; }
                body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 0; line-height: 1.4; font-size: 10pt; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; margin-bottom: 20px; }
                .company-details { text-align: right; font-size: 8pt; color: #444; }
                .company-name { font-weight: bold; color: #4b0082; font-size: 14pt; }
                .doc-title { text-align: center; color: #d32f2f; font-size: 18pt; margin: 15px 0; font-weight: bold; text-decoration: underline; }
                .section-header { border-left: 5px solid #d32f2f; padding: 5px 10px; color: #4b0082; font-size: 12pt; font-weight: bold; margin: 20px 0 10px 0; background: #f2f2f2; text-transform: uppercase; }
                .details-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 4px; background: #fff; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .label { color: #666; font-weight: bold; width: 140px; display: inline-block; }
                .service-badge { background: #d32f2f; color: white; padding: 2px 8px; border-radius: 10px; font-size: 8pt; float: right; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${base64Logo}" style="max-height: 60px;" />
                <div class="company-details">
                    <div class="company-name">KLAR TRAVELS</div>
                    #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
                    HYDERABAD - 500 0073 | Mob: +918099359377 | GSTIN: 36BGCPS2420P1Z4
                </div>
            </div>

            <div class="doc-title">TRAVEL ITINERARY PROPOSAL</div>

            <div class="details-box">
                <div class="grid">
                    <div>
                        <p><strong>Client Name:</strong> {{lead_details.name}}</p>
                        <p><strong>Contact:</strong> {{lead_details.phone}}</p>
                    </div>
                    <div style="text-align: right;">
                        <p><strong>Email:</strong> {{lead_details.email}}</p>
                        <p><strong>Lead Location:</strong> {{lead_details.metadata.country_city}}</p>
                    </div>
                </div>
            </div>

            <div class="section-header">📍 SERVICE DETAILS</div>

            {{#each service_preferences}}
            <div class="details-box">
                <span class="service-badge">{{service_type}}</span>
                <h3 style="margin:0 0 10px 0; color:#4b0082;">{{title}}</h3>
                <p><i>{{description}}</i></p>

                <div class="grid">
                    {{#if (eq service_type "CHARTER_SERVICES")}}
                        <p><span class="label">Aircraft Type:</span> {{preferences.aircraft_type}}</p>
                        <p><span class="label">Route:</span> {{preferences.departure_port}} ➔ {{preferences.arrival_port}}</p>
                        <p><span class="label">Duration:</span> {{preferences.flight_duration}}</p>
                        <p><span class="label">Pax Capacity:</span> {{preferences.passenger_capacity}}</p>
                        <p><span class="label">Catering:</span> {{preferences.catering_services}}</p>
                        <p><span class="label">Schedule:</span> {{preferences.charter_start}} to {{preferences.charter_end}}</p>
                    {{/if}}

                    {{#if (eq service_type "EVENT_MANAGEMENT")}}
                        <p><span class="label">Event Type:</span> {{preferences.event_type}}</p>
                        <p><span class="label">Venue:</span> {{preferences.venue}}</p>
                        <p><span class="label">Attendees:</span> {{preferences.attendees}}</p>
                        <p><span class="label">Event Date:</span> {{preferences.event_date}}</p>
                        <p><span class="label">Scale:</span> {{preferences.event_scale}}</p>
                        <p><span class="label">Entertainment:</span> {{preferences.catering_entertainment}}</p>
                    {{/if}}

                    {{#if (eq service_type "YACHT_CHARTER")}}
                        <p><span class="label">Yacht Type:</span> {{preferences.yacht_type}}</p>
                        <p><span class="label">Ports:</span> {{preferences.departure_port}} to {{preferences.arrival_port}}</p>
                        <p><span class="label">Duration:</span> {{preferences.charter_duration}}</p>
                        <p><span class="label">Amenities:</span> {{preferences.yacht_amenities}}</p>
                        <p><span class="label">Crew:</span> {{preferences.crew_services}}</p>
                        <p><span class="label">Guests:</span> {{preferences.guests}}</p>
                    {{/if}}
                </div>
                {{#if preferences.special_requirements}}
                    <p style="color:#d32f2f; border-top:1px solid #eee; padding-top:10px;"><strong>Requirements:</strong> {{preferences.special_requirements}}</p>
                {{/if}}
            </div>
            {{/each}}
        </body>
        </html>
        `;

        return handlebars.compile(templateHtml)(itineraryData);
    },

    async generateBuffer(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();
        return Buffer.from(pdf);
    }
};


















