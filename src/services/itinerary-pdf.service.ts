import puppeteer from 'puppeteer';  
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const itineraryPdfService = {
    async generateHTML(itineraryData: any): Promise<string> {
        console.log("149 itinerary-pdf.service.ts-Received Itinerary Data for PDF Generation:", JSON.stringify(itineraryData, null, 2));
        
        // 1. EXTRACT DATA IF WRAPPED INSIDE A SERVICE RESPONSE OBJECT
        let normalizedData = itineraryData;
        if (itineraryData && itineraryData.hasOwnProperty('data')) {
            normalizedData = itineraryData.data;
        }

        // 2. SAFETY GUARD CLAUSE
        if (!normalizedData) {
            console.error("❌ PDF Engine Error: Normalized data payload is missing or undefined.");
            throw new Error("Template engine context structure cannot be blank.");
        }
        
        const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'klar_main_logo.png');
        let base64Logo = '';
        try {
            const bitmap = fs.readFileSync(logoPath);
            base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
        } catch (e) { 
            console.error("Logo asset could not be read from disk:", logoPath); 
        }

        handlebars.registerHelper('eq', (a, b) => a === b);
        
        // Helper to cleanly format array values like inclusions into a readable string
        handlebars.registerHelper('join', (array) => {
            if (!array || !Array.isArray(array)) return '';
            return array.join(', ');
        });

        const templateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { margin: 15mm; }
                html, body { margin: 0; padding: 0; background: #fff; }
                body { font-family: 'Arial', sans-serif; color: #333; line-height: 1.3; font-size: 9pt; }
                .header { display: block; clear: both; border-bottom: 2px solid #d32f2f; padding-bottom: 8px; margin-bottom: 12px; height: 55px; }
                .logo-container { float: left; }
                .company-details { float: right; text-align: right; font-size: 8pt; color: #444; line-height: 1.2; }
                .company-name { font-weight: bold; color: #4b0082; font-size: 13pt; margin-bottom: 2px; }
                .doc-title { clear: both; text-align: center; color: #d32f2f; font-size: 16pt; margin: 15px 0 10px 0; font-weight: bold; text-decoration: underline; }
                .section-header { border-left: 5px solid #d32f2f; padding: 4px 8px; color: #4b0082; font-size: 11pt; font-weight: bold; margin: 15px 0 8px 0; background: #f2f2f2; text-transform: uppercase; }
                
                /* Compact Container Box with tight bottom layout restrictions */
                .details-box { display: block; border: 1px solid #ccc; padding: 10px 12px; margin: 0 0 10px 0; border-radius: 4px; background: #fff; page-break-inside: avoid; box-sizing: border-box; }
                
                /* Excel Sheet Style Grid Layout with Solid Lines */
                .excel-table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 9pt; table-layout: fixed; background: #fff; }
                .excel-table td { border: 1px solid #bbb; padding: 5px 8px; vertical-align: top; width: 50%; box-sizing: border-box; }
                
                .label { color: #555; font-weight: bold; display: inline-block; }
                .value { color: #222; }
                .service-badge { background: #d32f2f; color: white; padding: 2px 8px; border-radius: 10px; font-size: 8pt; float: right; font-weight: bold; margin-top: -2px; }
                
                h3 { margin: 0 0 4px 0; color: #4b0082; font-size: 11pt; }
                p { margin: 3px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo-container">
                    <img src="${base64Logo}" style="max-height: 55px;" />
                </div>
                <div class="company-details">
                    <div class="company-name">KLAR TRAVELS</div>
                    #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
                    HYDERABAD - 500 0073 | Mob: +918099359377 | GSTIN: 36BGCPS2420P1Z4
                </div>
            </div>

            <div class="doc-title">TRAVEL ITINERARY PROPOSAL</div>

            <div class="details-box">
                <table class="excel-table">
                    <tr>
                        <td><span class="label">Client Name:</span> <span class="value">{{lead_details.name}}</span></td>
                        <td><span class="label">Email:</span> <span class="value">{{lead_details.email}}</span></td>
                    </tr>
                    <tr>
                        <td><span class="label">Contact:</span> <span class="value">{{lead_details.phone}}</span></td>
                        <td><span class="label">Lead Location:</span> <span class="value">{{lead_details.metadata.country_city}}</span></td>
                    </tr>
                </table>
            </div>

            <div class="section-header">📍 SERVICE DETAILS</div>

            {{#each service_preferences}}
            <div class="details-box">
                <span class="service-badge">{{service_type}}</span>
                <h3>{{title}}</h3>
                <p style="margin-bottom: 6px;"><i>{{description}}</i></p>

                <table class="excel-table">
                    {{#if (eq service_type "HOTELS")}}
                        <tr>
                            <td><span class="label">Hotel Name:</span> <span class="value">{{preferences.hotel_name}}</span></td>
                            <td><span class="label">Category:</span> <span class="value">{{preferences.hotel_category}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Room Type:</span> <span class="value">{{preferences.room_type}}</span></td>
                            <td><span class="label">Stay Type:</span> <span class="value">{{preferences.stay_type}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Meal Plan:</span> <span class="value">{{preferences.meal_plan}}</span></td>
                            <td><span class="label">Location:</span> <span class="value">{{preferences.location}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Check In:</span> <span class="value">{{preferences.check_in_date}}</span></td>
                            <td><span class="label">Check Out:</span> <span class="value">{{preferences.check_out_date}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Preferred Area:</span> <span class="value">{{preferences.better_location}}</span></td>
                            <td><span class="label">Amenities:</span> <span class="value">{{preferences.premium_amenities}}</span></td>
                        </tr>
                    {{/if}}

                    {{#if (eq service_type "TRANSFERS")}}
                        <tr>
                            <td><span class="label">Vehicle Type:</span> <span class="value">{{preferences.vehicle_type}}</span></td>
                            <td><span class="label">Transfer Type:</span> <span class="value">{{preferences.transfer_type}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Transfer Date:</span> <span class="value">{{preferences.transfer_date_time}}</span></td>
                            <td><span class="label">Passengers:</span> <span class="value">{{preferences.passengers}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Pickup Location:</span> <span class="value">{{preferences.pickup_location}}</span></td>
                            <td><span class="label">Drop Location:</span> <span class="value">{{preferences.drop_location}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Est. Price:</span> <span class="value">₹{{preferences.estimated_price}}</span></td>
                            <td></td>
                        </tr>
                    {{/if}}

                    {{#if (eq service_type "TOUR_PACKAGES")}}
                        <tr>
                            <td><span class="label">Destination:</span> <span class="value">{{preferences.destination}}</span></td>
                            <td><span class="label">Tour Type:</span> <span class="value">{{preferences.tour_type}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Package Scale:</span> <span class="value">{{preferences.package_type}}</span></td>
                            <td><span class="label">Price per Person:</span> <span class="value">₹{{preferences.estimated_price_per_person}}</span></td>
                        </tr>
                        <tr>
                            <td colspan="2"><span class="label">Duration:</span> <span class="value">{{preferences.tour_start_date}} to {{preferences.tour_end_date}}</span></td>
                        </tr>
                        <tr>
                            <td colspan="2"><span class="label">Inclusions:</span> <span class="value">{{join preferences.inclusions}}</span></td>
                        </tr>
                    {{/if}}

                    {{#if (eq service_type "FLIGHTS")}}
                        <tr>
                            <td><span class="label">Airline:</span> <span class="value">{{preferences.airline}}</span></td>
                            <td><span class="label">Route:</span> <span class="value">{{preferences.route}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Travel Date:</span> <span class="value">{{preferences.date}}</span></td>
                            <td><span class="label">Cabin Class:</span> <span class="value">{{preferences.cabin_class}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Fare Type:</span> <span class="value">{{preferences.fare_type}}</span></td>
                            <td><span class="label">Est. Price (Pax):</span> <span class="value">₹{{preferences.estimated_price_per_person}}</span></td>
                        </tr>
                    {{/if}}

                    {{#if (eq service_type "CHARTER_SERVICES")}}
                        <tr>
                            <td><span class="label">Aircraft Type:</span> <span class="value">{{preferences.aircraft_type}}</span></td>
                            <td><span class="label">Route:</span> <span class="value">{{preferences.departure_port}} ➔ {{preferences.arrival_port}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Duration:</span> <span class="value">{{preferences.flight_duration}}</span></td>
                            <td><span class="label">Pax Capacity:</span> <span class="value">{{preferences.passenger_capacity}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Catering:</span> <span class="value">{{preferences.catering_services}}</span></td>
                            <td><span class="label">Schedule:</span> <span class="value">{{preferences.charter_start}} to {{preferences.charter_end}}</span></td>
                        </tr>
                    {{/if}}

                    {{#if (eq service_type "EVENT_MANAGEMENT")}}
                        <tr>
                            <td><span class="label">Event Type:</span> <span class="value">{{preferences.event_type}}</span></td>
                            <td><span class="label">Venue:</span> <span class="value">{{preferences.venue}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Attendees:</span> <span class="value">{{preferences.attendees}}</span></td>
                            <td><span class="label">Event Date:</span> <span class="value">{{preferences.event_date}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Scale:</span> <span class="value">{{preferences.event_scale}}</span></td>
                            <td><span class="label">Entertainment:</span> <span class="value">{{preferences.catering_entertainment}}</span></td>
                        </tr>
                    {{/if}}

                    {{#if (eq service_type "YACHT_CHARTER")}}
                        <tr>
                            <td><span class="label">Yacht Type:</span> <span class="value">{{preferences.yacht_type}}</span></td>
                            <td><span class="label">Ports:</span> <span class="value">{{preferences.departure_port}} to {{preferences.arrival_port}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Duration:</span> <span class="value">{{preferences.charter_duration}}</span></td>
                            <td><span class="label">Amenities:</span> <span class="value">{{preferences.yacht_amenities}}</span></td>
                        </tr>
                        <tr>
                            <td><span class="label">Crew:</span> <span class="value">{{preferences.crew_services}}</span></td>
                            <td><span class="label">Guests:</span> <span class="value">{{preferences.guests}}</span></td>
                        </tr>
                    {{/if}}
                </table>
                
                {{#if preferences.experience_highlights}}
                    <p style="color:#4b0082; border-top:1px solid #eee; padding-top:6px; margin-top:6px; font-size:8.5pt;"><strong>Highlights:</strong> {{preferences.experience_highlights}}</p>
                {{/if}}
                {{#if preferences.special_requirements}}
                    <p style="color:#d32f2f; border-top:1px solid #eee; padding-top:6px; margin-top:6px; font-size:8.5pt;"><strong>Requirements:</strong> {{preferences.special_requirements}}</p>
                {{/if}}
                {{#if preferences.notes}}
                    <p style="color:#555; border-top:1px solid #eee; padding-top:6px; margin-top:6px; font-size:8.5pt;"><strong>Notes:</strong> {{preferences.notes}}</p>
                {{/if}}
            </div>
            {{/each}}
        </body>
        </html>
        `;

        // 3. COMPILE AND INJECT THE NORMALIZED PAYLOAD
        return handlebars.compile(templateHtml)(normalizedData);
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