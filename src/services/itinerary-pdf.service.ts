import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const itineraryPdfService = {
    async generateHTML(itineraryData: any, forEmail: boolean = false): Promise<string> {
        
        let normalizedData = itineraryData;
        if (itineraryData && itineraryData.hasOwnProperty('data')) {
            normalizedData = itineraryData.data;
        }

        if (!normalizedData) {
            throw new Error("Template engine context structure cannot be blank.");
        }
        const logoUrl = 'https://travel-pdfs-prod-399934155938-eu-north-1-an.s3.eu-north-1.amazonaws.com/pdf/Frame%201000007152%202.png';

        let logoSrc = '';
        if (forEmail) {
            logoSrc = logoUrl;
        } else {
            logoSrc = logoUrl;
        }

        const logoHtmlTag = logoSrc 
            ? `<img src="${logoSrc}" alt="KLAR TRAVELS" />` 
            : '<div style="font-weight: bold; color: #4b0082; font-size: 16px;">KLAR TRAVELS</div>';

        handlebars.registerHelper('eq', (a: any, b: any) => a === b);
        
        handlebars.registerHelper('join', (array: any) => {
            if (!array || !Array.isArray(array)) return '';
            return array.join(', ');
        });

        const templateHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                /* Reset styles for email clients */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Arial', 'Helvetica', sans-serif;
                    background-color: #f5f5f5;
                    margin: 0;
                    padding: 20px 0;
                }
                
                /* Main container with center alignment */
                .email-container {
                    max-width: 800px;
                    width: 100%;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                /* Inner content wrapper */
                .email-content {
                    padding: 20px 25px;
                    background: #fff;
                }
                
                /* Bulletproof Table structure for Email/PDF Header layout alignment */
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
                }
                
                .logo-container img {
                    max-height: 55px;
                    width: auto;
                    display: block;
                }
                
                /* Text fallback when logo doesn't load */
                .logo-text-fallback {
                    display: none;
                    font-weight: bold;
                    color: #4b0082;
                    font-size: 16px;
                }
                
                .logo-container img[alt]:after {
                    content: attr(alt);
                    display: none;
                }
                
                .company-details {
                    text-align: right;
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
                
                /* Document title */
                .doc-title {
                    text-align: center;
                    color: #d32f2f;
                    font-size: 18pt;
                    margin: 20px 0;
                    font-weight: bold;
                    text-decoration: underline;
                }
                
                /* Section headers */
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
                
                /* Details box */
                .details-box {
                    border: 1px solid #ddd;
                    padding: 15px;
                    margin: 0 0 15px 0;
                    border-radius: 6px;
                    background: #fff;
                    page-break-inside: avoid;
                }
                
                /* Excel sheet style table */
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
                
                /* Label and value styles */
                .label {
                    color: #666;
                    font-weight: bold;
                    display: inline-block;
                    min-width: 100px;
                }
                
                .value {
                    color: #222;
                }
                
                /* Service badge */
                .service-badge {
                    background: #d32f2f;
                    color: white;
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-size: 9pt;
                    float: right;
                    font-weight: bold;
                    margin-top: -5px;
                }
                
                h3 {
                    margin: 0 0 8px 0;
                    color: #4b0082;
                    font-size: 12pt;
                }
                
                p {
                    margin: 5px 0;
                    line-height: 1.4;
                }
                
                /* Additional info styles */
                .highlight-text {
                    color: #4b0082;
                    border-top: 1px solid #eee;
                    padding-top: 8px;
                    margin-top: 8px;
                    font-size: 9pt;
                }
                
                .requirement-text {
                    color: #d32f2f;
                    border-top: 1px solid #eee;
                    padding-top: 8px;
                    margin-top: 8px;
                    font-size: 9pt;
                }
                
                .notes-text {
                    color: #555;
                    border-top: 1px solid #eee;
                    padding-top: 8px;
                    margin-top: 8px;
                    font-size: 9pt;
                }
                
                /* Responsive adjustments for mobile */
                @media only screen and (max-width: 600px) {
                    .invoice-content {
                        padding: 20px;
                    }
                    
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
                    
                    .service-badge {
                        float: none;
                        display: inline-block;
                        margin-bottom: 10px;
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
                
                /* Print styles for PDF */
                @media print {
                    body {
                        background: white;
                        padding: 0;
                        margin: 0;
                    }
                    
                    .email-container {
                        max-width: 100%;
                        margin: 0;
                        box-shadow: none;
                    }
                    
                    .details-box {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-content">
                    
                    <table class="header-table">
                        <tr>
                            <td class="logo-container" style="width: 50%;">
                                ${logoHtmlTag}
                            </td>
                            <td class="company-details" style="width: 50%;">
                                <div class="company-name">KLAR TRAVELS</div>
                                #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
                                HYDERABAD - 500 0073 | Mob: +918099359377 | GSTIN: 36BGCPS2420P1Z4
                            </td>
                        </tr>
                    </table>

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
                        <p style="margin-bottom: 10px;"><i>{{description}}</i></p>

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
                            <p class="highlight-text"><strong>✨ Highlights:</strong> {{preferences.experience_highlights}}</p>
                        {{/if}}
                        {{#if preferences.special_requirements}}
                            <p class="requirement-text"><strong>⚠️ Requirements:</strong> {{preferences.special_requirements}}</p>
                        {{/if}}
                        {{#if preferences.notes}}
                            <p class="notes-text"><strong>📝 Notes:</strong> {{preferences.notes}}</p>
                        {{/if}}
                    </div>
                    {{/each}}
                </div>
            </div>
        </body>
        </html>
        `;

        return handlebars.compile(templateHtml)({
            ...normalizedData,
            logoHtmlTag
        });
    },

    async generateEmailHTML(itineraryData: any): Promise<string> {
        return this.generateHTML(itineraryData, true);
    },

    async generatePDFBuffer(itineraryData: any): Promise<Buffer> {
        const html = await this.generateHTML(itineraryData, false);
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
        // Fixed: Using type assertion to handle the 'networkidle0' option
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
        // Fixed: Using type assertion to handle the 'networkidle0' option
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