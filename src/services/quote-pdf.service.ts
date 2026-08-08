import { renderPdf } from './pdf-browser.service';
import handlebars from 'handlebars';
import { supabaseAdmin } from '../config';

export const quotePdfService = {
    async getPreferencesByLeadId(leadId: string): Promise<any[]> {
        if (!leadId) {
            return [];
        }

        const { data, error } = await supabaseAdmin
            .from('service_preferences')
            .select('*')
            .eq('lead_id', leadId)
            .order('preference_order', { ascending: true });

        if (error) {
            console.warn(`quote-pdf.service.ts: Failed to fetch service preferences for lead_id=${leadId}`, error.message);
            return [];
        }

        return data ?? [];
    },

    async generateHTML(quoteData: any): Promise<string> {
        console.log("quote-pdf.service.ts: Generating HTML for quote data:", JSON.stringify(quoteData));

        const servicePreferences = quoteData?.lead_id
            ? await this.getPreferencesByLeadId(quoteData.lead_id)
            : [];
        
        const hostedLogoUrl = 'https://travel-pdfs-prod-399934155938-eu-north-1-an.s3.eu-north-1.amazonaws.com/pdf/logo.png';
        const logoHtmlTag = `<img src="${hostedLogoUrl}" style="max-height: 60px; display: block;" alt="KLAR TRAVELS" />`;

        // Register date formatter helper
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

        // Register currency formatter helper
        if (!handlebars.helpers['formatCurrency']) {
            handlebars.registerHelper('formatCurrency', (amount: number) => {
                if (amount === undefined || amount === null) return '0.00';
                return new Intl.NumberFormat('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(amount);
            });
        }

        // Register description helper
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
                
                .quote-container {
                    max-width: 1000px;
                    width: 100%;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                }
                
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
                .doc-title { text-align: center; color: #d32f2f; font-size: 19pt; font-weight: bold; margin: 20px 0 10px 0; letter-spacing: 0.5px; text-decoration: underline; }
                .quote-subtitle { text-align: center; color: #4b0082; font-size: 11pt; font-weight: 600; margin-bottom: 20px; }

                .details-box { border: 1px solid #b0b0b0; padding: 14px; margin-bottom: 18px; background: #fff; border-radius: 4px; }
                .grid-2 { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px; }
                
                p { margin: 0; padding: 0; }
                .field-label { color: #555; font-weight: 600; font-size: 9.5pt; display: inline-block; width: 110px; }
                .field-label-right { color: #555; font-weight: 600; font-size: 9.5pt; display: inline-block; width: 85px; text-align: left; }
                .field-value { color: #111; font-weight: 500; }

                table.preference-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                table.preference-table th, table.preference-table td { border: 1px solid #d1d1d1; padding: 8px 10px; font-size: 9pt; }
                table.preference-table th { background: #eef0ff; color: #2c3e50; text-align: left; }
                table.preference-table td:first-child { width: 28%; font-weight: 700; color: #333; vertical-align: top; }
                table.preference-table td:last-child { width: 72%; color: #2c3e50; }

                table.invoice-items-table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                th { background: #4b0082; color: white; border: 1px solid #9c7bb5; padding: 11px 10px; text-align: left; font-size: 9.5pt; font-weight: bold; }
                td { border: 1px solid #b0b0b0; padding: 11px 10px; vertical-align: middle; font-size: 9.5pt; }
                
                .total-row { background: #fff5f5; font-weight: bold; }
                .total-row td { border-top: 1px solid #4b0082; }
                
                .file-link {
                    color: #0066cc;
                    text-decoration: none;
                    font-weight: 600;
                }

                @media print {
                    body { background: white; padding: 0; }
                    .quote-container { max-width: 100%; padding: 0; box-shadow: none; border-radius: 0; }
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
                {{#if quote_title}}
                <div class="quote-subtitle">{{quote_title}}</div>
                {{/if}}

                {{#if service_preferences.length}}
                <div class="details-box">
                    <div style="font-size: 10pt; font-weight: 700; margin-bottom: 10px; color: #4b0082;">Itinerary Preference Details</div>
                    {{#each service_preferences}}
                    <table class="preference-table">
                        <thead>
                            <tr>
                                <th colspan="2">{{title}}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{#if description}}
                            <tr>
                                <td>Flight Details</td>
                                <td>{{description}}</td>
                            </tr>
                            {{/if}}
                            {{#if preferences.departure_city}}
                            <tr>
                                <td>From</td>
                                <td>{{preferences.departure_city}}</td>
                            </tr>
                            {{/if}}
                            {{#if preferences.arrival_city}}
                            <tr>
                                <td>To</td>
                                <td>{{preferences.arrival_city}}</td>
                            </tr>
                            {{/if}}
                            {{#unless preferences.departure_city}}
                            {{#if preferences.route}}
                            <tr>
                                <td>Route</td>
                                <td>{{preferences.route}}</td>
                            </tr>
                            {{/if}}
                            {{/unless}}
                            {{#if preferences.departure_date}}
                            <tr>
                                <td>Departure Date</td>
                                <td>{{formatDocDate preferences.departure_date}}</td>
                            </tr>
                            {{/if}}
                            {{#if preferences.arrival_date}}
                            <tr>
                                <td>Arrival Date</td>
                                <td>{{formatDocDate preferences.arrival_date}}</td>
                            </tr>
                            {{/if}}
                            {{#if preferences.flight_number}}
                            <tr>
                                <td>Flight Number</td>
                                <td>{{preferences.flight_number}}</td>
                            </tr>
                            {{/if}}
                        </tbody>
                    </table>
                    <table class="preference-table" style="margin-top: 8px;">
                        <tbody>
                            {{#if preferences.estimated_price_per_person}}
                            <tr>
                                <td>Price per Person</td>
                                <td>₹{{formatCurrency preferences.estimated_price_per_person}}</td>
                            </tr>
                            {{/if}}
                            {{#if estimated_price}}
                            <tr>
                                <td>Estimated Price</td>
                                <td>₹{{formatCurrency estimated_price}}</td>
                            </tr>
                            {{/if}}
                            {{#if preferences.currency}}
                            <tr>
                                <td>Currency</td>
                                <td>{{preferences.currency}}</td>
                            </tr>
                            {{/if}}
                        </tbody>
                    </table>
                    {{/each}}
                </div>
                {{/if}}

                <div class="details-box">
                    <div class="grid-2">
                        <div>
                            <p style="margin-bottom: 6px;"><span class="field-label">Client Name:</span><span class="field-value" style="font-weight: bold;">{{client_name}}</span></p>
                            <p style="margin-bottom: 6px;"><span class="field-label">Client Email:</span><span class="field-value">{{client_email}}</span></p>
                            {{#if client_phone}}
                            <p style="margin-bottom: 6px;"><span class="field-label">Client Phone:</span><span class="field-value">{{client_phone}}</span></p>
                            {{/if}}
                            {{#if client_address}}
                            <p style="margin-bottom: 6px;"><span class="field-label">Address:</span><span class="field-value">{{client_address}}</span></p>
                            {{/if}}
                            {{#if destination}}
                            <p style="margin-bottom: 6px;"><span class="field-label">Destination:</span><span class="field-value">{{destination}}</span></p>
                            {{/if}}
                        </div>
                        <div style="text-align: right;">
                            <p style="margin-bottom: 6px;"><span class="field-label-right">Quote No:</span><span class="field-value" style="font-weight: bold; color: #d32f2f;">{{quote_number}}</span></p>
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
                                <strong style="color: #4b0082; font-size: 10pt;">{{cleanDescription service_name}}</strong>
                                {{#if description}}
                                    <div style="color: #333; font-size: 9pt; margin-top: 2px;">{{description}}</div>
                                {{/if}}

                                <div style="color:#555; margin-top: 5px; font-size: 8.5pt; line-height: 1.4;">
                                    {{#if details.is_file_based}}
                                        <strong>Attachment:</strong> 
                                        <a href="{{details.file_url}}" class="file-link" target="_blank">{{#if details.file_name}}{{details.file_name}}{{else}}View File{{/if}}</a>
                                    {{/if}}

                                    {{#if details.baseFare}} Flight Base Fare: ₹{{formatCurrency details.baseFare}} | {{/if}}
                                    {{#if details.roomCharges}} Room Rent Charges: ₹{{formatCurrency details.roomCharges}} | {{/if}}
                                    {{#if details.vehicleCost}} Vehicle Cost Base: ₹{{formatCurrency details.vehicleCost}} | {{/if}}
                                    {{#if details.driverAllowance}} Driver Allowance: ₹{{formatCurrency details.driverAllowance}} | {{/if}}
                                    {{#if details.tollParking}} Toll & Parking: ₹{{formatCurrency details.tollParking}} | {{/if}}
                                    {{#if details.fuelCharges}} Fuel Charges: ₹{{formatCurrency details.fuelCharges}} | {{/if}}
                                    {{#if details.crewCharges}} Crew Charges: ₹{{formatCurrency details.crewCharges}} | {{/if}}
                                    
                                    {{#each details.categories}}
                                        <br><strong>{{category_name}}:</strong> 
                                        {{#each sub_services}}{{sub_service_name}}{{#unless @last}}, {{/unless}}{{/each}}
                                    {{/each}}
                                </div>
                            </td>
                            <td style="text-align:center; font-weight: bold;">{{quantity}}</td>
                            <td style="text-align:right; font-weight: 500;">{{formatCurrency unit_price}}</td>
                            <td style="text-align:right; font-weight: bold;">
                                {{#if total_with_tax}}{{formatCurrency total_with_tax}}{{else}}{{formatCurrency total}}{{/if}}
                            </td>
                        </tr>
                        {{/each}}

                        {{#if discount_amount}}
                        <tr>
                            <td colspan="3" style="text-align:right; font-weight: bold; color: #555;">INITIAL AMOUNT</td>
                            <td style="text-align:right; font-weight: bold;">{{formatCurrency initial_amount}}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align:right; color: #2e7d32; font-weight: 600;">DISCOUNT ({{discount_percent}}%)</td>
                            <td style="text-align:right; color: #2e7d32; font-weight: 600;">- {{formatCurrency discount_amount}}</td>
                        </tr>
                        {{/if}}

                        <tr class="total-row">
                            <td colspan="3" style="text-align:right; font-weight: bold;">SUBTOTAL</td>
                            <td style="text-align:right; font-weight: bold;">{{formatCurrency subtotal}}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="text-align:right; color: #555; font-weight: 600;">
                                TAX {{#if tax_rate}}({{tax_rate}}%){{else}}(0%){{/if}}
                            </td>
                            <td style="text-align:right; color: #555; font-weight: 600;">{{formatCurrency tax_amount}}</td>
                        </tr>
                        <tr class="total-row" style="color: #d32f2f; font-size: 11.5pt; background: #fdf2f2;">
                            <td colspan="3" style="text-align:right; font-weight: bold;">NET PAYABLE</td>
                            <td style="text-align:right; font-weight: 900;">{{currency}} {{formatCurrency final_amount}}</td>
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
            logoHtmlTag,
            service_preferences: servicePreferences
        });
    },

    async generateBuffer(html: string): Promise<Buffer> {
        return await renderPdf(html);
    }
};