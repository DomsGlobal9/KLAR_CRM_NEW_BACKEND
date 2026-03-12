import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

export const itineraryPdfService = {
    async generateHTML(itinerary: any): Promise<string> {
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
                body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 0; line-height: 1.4; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; }
                .company-details { text-align: right; font-size: 8pt; color: #444; }
                .company-name { font-weight: bold; color: #4b0082; font-size: 14pt; }
                .doc-title { text-align: center; color: #d32f2f; font-size: 20pt; margin: 20px 0; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                .section-header { background: #4b0082; color: white; padding: 8px 15px; border-radius: 4px; font-size: 12pt; margin: 20px 0 10px; }
                .details-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .label { font-weight: bold; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${base64Logo}" style="max-height: 60px;" />
                <div class="company-details">
                    <div class="company-name">KLAR TRAVELS</div>
                    #8-3-949/4 & 5, MADHU'S HOUSE, AMEERPET, PANJAGUTTA<br>
                    HYDERABAD - 500 0073 | Mob: +918099359377<br>
                    GSTIN: 36BGCPS2420P1Z4
                </div>
            </div>

            <div class="doc-title">TRAVEL ITINERARY</div>

            <div class="details-box">
                <div class="grid">
                    <div><strong>Traveler:</strong> {{itinerary.lead_details.name}}</div>
                    <div style="text-align: right;"><strong>Email:</strong> {{itinerary.lead_details.email}}</div>
                    <div><strong>Contact:</strong> {{itinerary.lead_details.phone}}</div>
                    <div style="text-align: right;"><strong>Origin:</strong> {{itinerary.lead_details.metadata.country_city}}</div>
                </div>
            </div>

            <div class="section-header">SERVICE DETAILS</div>
            {{#each itinerary.service_preferences}}
            <div class="details-box">
                <h3 style="margin:0; color:#d32f2f;">{{title}}</h3>
                <p>{{description}}</p>
                <div class="grid">
                    {{#if (eq service_type "TOUR_PACKAGES")}}
                        <p><span class="label">Destination:</span> {{preferences.destination}}</p>
                        <p><span class="label">Duration:</span> {{preferences.duration}} Days</p>
                        <p><span class="label">Dates:</span> {{preferences.tour_start_date}} to {{preferences.tour_end_date}}</p>
                    {{/if}}
                    {{#if (eq service_type "CHARTER_SERVICES")}}
                        <p><span class="label">Aircraft:</span> {{preferences.aircraft_type}}</p>
                        <p><span class="label">Route:</span> {{preferences.departure_port}} ➔ {{preferences.arrival_port}}</p>
                    {{/if}}
                </div>
                {{#if preferences.special_requirements}}
                <p style="color: #d32f2f;"><strong>Special Requirements:</strong> {{preferences.special_requirements}}</p>
                {{/if}}
            </div>
            {{/each}}
        </body>
        </html>`;

        const template = handlebars.compile(templateHtml);
        return template({ itinerary });
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