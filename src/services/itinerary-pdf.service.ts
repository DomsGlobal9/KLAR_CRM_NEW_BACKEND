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
                body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 0; line-height: 1.4; font-size: 10pt; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; margin-bottom: 20px; }
                .company-details { text-align: right; font-size: 8pt; color: #444; }
                .company-name { font-weight: bold; color: #4b0082; font-size: 14pt; }
                .doc-title { text-align: center; color: #d32f2f; font-size: 18pt; margin: 15px 0; font-weight: bold; text-decoration: underline; }
                .section-header { border-left: 5px solid #d32f2f; padding: 5px 10px; color: #4b0082; font-size: 12pt; font-weight: bold; margin: 20px 0 10px 0; background: #f2f2f2; text-transform: uppercase; }
                .details-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 4px; background: #fff; page-break-inside: avoid; }
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
                    {{#if (eq service_type "HOTELS")}}
                        <p><span class="label">Hotel Name:</span> {{preferences.hotel_name}}</p>
                        <p><span class="label">Category:</span> {{preferences.hotel_category}}</p>
                        <p><span class="label">Room Type:</span> {{preferences.room_type}}</p>
                        <p><span class="label">Stay Type:</span> {{preferences.stay_type}}</p>
                        <p><span class="label">Meal Plan:</span> {{preferences.meal_plan}}</p>
                        <p><span class="label">Location:</span> {{preferences.location}}</p>
                        <p><span class="label">Check In:</span> {{preferences.check_in_date}}</p>
                        <p><span class="label">Check Out:</span> {{preferences.check_out_date}}</p>
                        <p><span class="label">Preferred Area:</span> {{preferences.better_location}}</p>
                        <p><span class="label">Amenities:</span> {{preferences.premium_amenities}}</p>
                    {{/if}}

                    {{#if (eq service_type "TRANSFERS")}}
                        <p><span class="label">Vehicle Type:</span> {{preferences.vehicle_type}}</p>
                        <p><span class="label">Transfer Type:</span> {{preferences.transfer_type}}</p>
                        <p><span class="label">Transfer Date:</span> {{preferences.transfer_date_time}}</p>
                        <p><span class="label">Passengers:</span> {{preferences.passengers}}</p>
                        <p><span class="label">Pickup Location:</span> {{preferences.pickup_location}}</p>
                        <p><span class="label">Drop Location:</span> {{preferences.drop_location}}</p>
                        <p><span class="label">Est. Price:</span> ₹{{preferences.estimated_price}}</p>
                    {{/if}}

                    {{#if (eq service_type "TOUR_PACKAGES")}}
                        <p><span class="label">Destination:</span> {{preferences.destination}}</p>
                        <p><span class="label">Tour Type:</span> {{preferences.tour_type}}</p>
                        <p><span class="label">Package Scale:</span> {{preferences.package_type}}</p>
                        <p><span class="label">Duration:</span> {{preferences.tour_start_date}} to {{preferences.tour_end_date}}</p>
                        <p><span class="label">Price per Person:</span> ₹{{preferences.estimated_price_per_person}}</p>
                        <p><span class="label">Inclusions:</span> {{join preferences.inclusions}}</p>
                    {{/if}}

                    {{#if (eq service_type "FLIGHTS")}}
                        <p><span class="label">Airline:</span> {{preferences.airline}}</p>
                        <p><span class="label">Route:</span> {{preferences.route}}</p>
                        <p><span class="label">Travel Date:</span> {{preferences.date}}</p>
                        <p><span class="label">Cabin Class:</span> {{preferences.cabin_class}}</p>
                        <p><span class="label">Fare Type:</span> {{preferences.fare_type}}</p>
                        <p><span class="label">Est. Price (Pax):</span> ₹{{preferences.estimated_price_per_person}}</p>
                    {{/if}}

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
                {{#if preferences.experience_highlights}}
                    <p style="color:#4b0082; border-top:1px solid #eee; padding-top:10px; margin-bottom: 0;"><strong>Highlights:</strong> {{preferences.experience_highlights}}</p>
                {{/if}}
                {{#if preferences.special_requirements}}
                    <p style="color:#d32f2f; border-top:1px solid #eee; padding-top:10px; margin-bottom: 0;"><strong>Requirements:</strong> {{preferences.special_requirements}}</p>
                {{/if}}
                {{#if preferences.notes}}
                    <p style="color:#555; border-top:1px solid #eee; padding-top:10px; margin-bottom: 0;"><strong>Notes:</strong> {{preferences.notes}}</p>
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