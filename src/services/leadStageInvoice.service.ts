// import { CreateLeadStageInvoicePayload } from '../interfaces/leadStageInvoice.interface';
// import { leadStageInvoiceRepository } from '../repositories/leadStageInvoice.repository';

// export const leadStageInvoiceService = {
//   /**
//    * Enforces business edge cases and processes safe system string identifiers
//    */
//   async createInvoiceFromVoucher(payload: CreateLeadStageInvoicePayload) {
//     // Core property validation sanity checklist
//     if (!payload.voucher_id || !payload.lead_id || !payload.lead_name) {
//       throw new Error('Validation exception: voucher_id, lead_id, and lead_name are required inputs.');
//     }

//     if (payload.paid_amount < 0 || payload.voucher_total <= 0) {
//       throw new Error('Validation exception: Numerical currency amounts cannot be negative values.');
//     }

//     // Auto-serialize a clean human-readable invoice reference tracker sequence matching standard workflows
//     const sequentialInvoiceNumber = `INV-LS-${Date.now()}`;

//     const extendedPayload = {
//       ...payload,
//       invoice_number: sequentialInvoiceNumber,
//       status: payload.rest_amount <= 0 ? 'paid' : payload.paid_amount > 0 ? 'partial' : 'sent',
//       created_at: new Date().toISOString()
//     };

//     return await leadStageInvoiceRepository.insertInvoiceRecord(extendedPayload);
//   }
// };






























// import { CreateLeadStageInvoicePayload } from '../interfaces/leadStageInvoice.interface';
// import { leadStageInvoiceRepository } from '../repositories/leadStageInvoice.repository';
// import { s3UploadService } from './s3-upload.service';
// import { pdfDeliveryService } from './pdfDelivery.service';
// import { processPDFDelivery } from '../helpers/pdfDelivery.helper';
// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';

// export const leadStageInvoiceService = {
//   /**
//    * Enforces business edge cases and processes safe system string identifiers
//    */
//   async createInvoiceFromVoucher(payload: CreateLeadStageInvoicePayload) {
//     if (!payload.voucher_id || !payload.lead_id || !payload.lead_name) {
//       throw new Error('Validation exception: voucher_id, lead_id, and lead_name are required inputs.');
//     }

//     if (payload.paid_amount < 0 || payload.voucher_total <= 0) {
//       throw new Error('Validation exception: Numerical currency amounts cannot be negative values.');
//     }

//     const sequentialInvoiceNumber = `INV-LS-${Date.now()}`;

//     const extendedPayload = {
//       ...payload,
//       invoice_number: sequentialInvoiceNumber,
//       status: payload.rest_amount <= 0 ? 'paid' : payload.paid_amount > 0 ? 'partial' : 'sent',
//       created_at: new Date().toISOString()
//     };

//     return await leadStageInvoiceRepository.insertInvoiceRecord(extendedPayload);
//   },

//   /**
//    * Compiles dynamic handlebars strings using clean system contexts into raw memory buffers
//    */
//   async generateInvoicePDFBuffer(invoiceId: string): Promise<{ buffer: Buffer; invoiceNumber: string }> {
//     const invoice = await leadStageInvoiceRepository.getInvoiceById(invoiceId);
//     if (!invoice) throw new Error('Target invoice matching trace criteria does not exist.');

//     const htmlContent = await this.compileInvoiceHTML(invoice);
    
//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
//     });
    
//     const page = await browser.newPage();
//     await page.setContent(htmlContent, { waitUntil: 'networkidle0' as any });
    
//     const pdfBuffer = await page.pdf({
//       format: 'A4',
//       printBackground: true,
//       margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
//     });

//     await browser.close();
//     return {
//       buffer: Buffer.from(pdfBuffer),
//       invoiceNumber: invoice.invoice_number
//     };
//   },

//   /**
//    * Handles multi-channel delivery mapping patterns using common system communication routers
//    */
//   async shareAndDeliverInvoice(invoiceId: string, sendVia: any) {
//     const invoice = await leadStageInvoiceRepository.getInvoiceById(invoiceId);
//     if (!invoice) throw new Error('Target invoice record does not exist across active contexts.');

//     // Extract compiled data layers
//     const htmlContent = await this.compileInvoiceHTML(invoice);
//     const { buffer } = await this.generateInvoicePDFBuffer(invoiceId);

//     // Format secure system identifiers cleanly
//     const clientSanitizedName = invoice.lead_name.replace(/\s+/g, '_') || 'client';
//     const fileName = `invoice_${invoice.invoice_number}_${clientSanitizedName}.pdf`;

//     // Process S3 file cloud pipeline storage migrations
//     const publicUrl = await s3UploadService.uploadToS3(buffer, fileName);

//     const deliveryOptions = {
//       leadId: invoice.lead_id,
//       clientName: invoice.lead_name,
//       clientEmail: invoice.lead_email,
//       clientPhone: invoice.lead_phone,
//       pdfUrl: publicUrl,
//       pdfFileName: fileName,
//       htmlContent: htmlContent
//     };

//     // Dispatches through standard cross-channel distribution utility helpers safely
//     const deliveryResult = await processPDFDelivery(deliveryOptions, sendVia);

//     return {
//       publicUrl,
//       leadId: invoice.lead_id,
//       clientPhone: invoice.lead_phone,
//       clientEmail: invoice.lead_email,
//       deliveryResult
//     };
//   },

//   /**
//    * Triggers sequence blocks down to db schemas to clean row structures instantly
//    */
//   async deleteInvoiceRecord(invoiceId: string) {
//     return await leadStageInvoiceRepository.deleteInvoiceRecord(invoiceId);
//   },

//   /**
//    * Dynamic Handlebars template markup tracking travel components
//    */
//   async compileInvoiceHTML(invoice: any): Promise<string> {
//     handlebars.registerHelper('eq', (a: any, b: any) => a === b);
//     handlebars.registerHelper('formatDate', (dateStr: string) => {
//       if (!dateStr) return 'N/A';
//       return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
//     });

//     const templateHtml = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//         <meta charset="UTF-8">
//         <style>
//             * { margin: 0; padding: 0; box-sizing: border-box; }
//             body { font-family: 'Arial', sans-serif; background-color: #fff; color: #333; padding: 10px; font-size: 10pt; }
//             .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; }
//             .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 2px solid #0284c7; }
//             .header-table td { padding-bottom: 15px; vertical-align: top; }
//             .logo-text { font-size: 24pt; font-weight: bold; color: #0284c7; }
//             .company-details { text-align: right; font-size: 9pt; color: #555; line-height: 1.4; }
//             .doc-title { text-align: center; color: #0284c7; font-size: 20pt; margin: 15px 0; font-weight: bold; letter-spacing: 1px; }
//             .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
//             .meta-table td { border: 1px solid #e2e8f0; padding: 10px; width: 50%; vertical-align: top; }
//             .section-title { background: #f1f5f9; padding: 6px 10px; font-weight: bold; color: #1e293b; margin-bottom: 10px; border-left: 4px solid #0284c7; text-transform: uppercase; }
//             .item-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
//             .item-table th { background: #0284c7; color: white; padding: 8px 10px; font-weight: bold; text-align: left; font-size: 9pt; }
//             .item-table td { border: 1px solid #e2e8f0; padding: 10px; vertical-align: top; }
//             .text-right { text-align: right; }
//             .bold { font-weight: bold; }
//             .totals-box { width: 40%; float: right; margin-bottom: 20px; }
//             .totals-table { width: 100%; border-collapse: collapse; }
//             .totals-table td { padding: 6px 10px; border: 1px solid #e2e8f0; }
//             .terms-box { width: 55%; float: left; font-size: 8pt; color: #555; line-height: 1.4; white-space: pre-line; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; }
//             .footer-note { clear: both; text-align: center; font-size: 8pt; color: #94a3b8; padding-top: 30px; }
//             .badge { display: inline-block; padding: 2px 8px; font-size: 8pt; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
//             .badge-paid { background: #dcfce7; color: #15803d; }
//             .badge-partial { background: #ffedd5; color: #c2410c; }
//             .badge-sent { background: #dbeafe; color: #1d4ed8; }
//         </style>
//     </head>
//     <body>
//         <div class="container">
//             <table class="header-table">
//                 <tr>
//                     <td>
//                         <div class="logo-text">KLAR TRAVELS</div>
//                         <div style="font-size:9pt; color:#64748b; margin-top:2px;">Explore The Horizon</div>
//                     </td>
//                     <td class="company-details">
//                         <div style="font-weight:bold; color:#0284c7; font-size:11pt; margin-bottom:2px;">KLAR TRAVELS PRIVATE LIMITED</div>
//                         #8-3-949/4 & 5, MADHU'S HOUSE, PANJAGUTTA<br>
//                         HYDERABAD, TELANGANA - 500073<br>
//                         Mob: +918099359377 | Email: operations@klartravels.com<br>
//                         <strong>GSTIN: 36BGCPS2420P1Z4</strong>
//                     </td>
//                 </tr>
//             </table>

//             <div class="doc-title">TAX INVOICE</div>

//             <table class="meta-table">
//                 <tr>
//                     <td>
//                         <strong style="color:#0284c7;">BILLED TO:</strong><br>
//                         <span class="bold" style="font-size:11pt;">{{lead_name}}</span><br>
//                         {{#if lead_email}}Email: {{lead_email}}<br>{{/if}}
//                         {{#if lead_phone}}Phone: {{lead_phone}}<br>{{/if}}
//                         <div style="margin-top:5px; white-space: pre-wrap;"><strong>Address:</strong><br>{{billing_address}}</div>
//                         {{#if gst_number}}<div style="margin-top:4px;"><strong>Client GSTIN:</strong> {{gst_number}}</div>{{/if}}
//                     </td>
//                     <td>
//                         <strong style="color:#0284c7;">INVOICE DETAILS:</strong><br>
//                         <table style="width:100%; margin-top:5px;" class="totals-table">
//                             <tr><td>Invoice No:</td><td class="bold">{{invoice_number}}</td></tr>
//                             <tr><td>Invoice Date:</td><td>{{formatDate invoice_date}}</td></tr>
//                             <tr><td>Payment Method:</td><td>{{payment_method}}</td></tr>
//                             <tr><td>Currency:</td><td class="bold">{{currency}}</td></tr>
//                             <tr><td>Status:</td><td><span class="badge badge-{{status}}">{{status}}</span></td></tr>
//                         </table>
//                     </td>
//                 </tr>
//             </table>

//             <div class="section-header">💼 ACCOMMODATIONS & SERVICE LINE ITEMS</div>
//             <table class="item-table">
//                 <thead>
//                     <tr>
//                         <th style="width: 30%;">Service Component</th>
//                         <th style="width: 50%;">Configuration Mapping Context Details</th>
//                         <th style="width: 20%;" class="text-right">Total Cost</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {{#each service_configurations}}
//                     <tr>
//                         <td class="bold" style="color:#0369a1;">{{serviceName}}</td>
//                         <td>
//                             <div style="font-size:8.5pt; color:#475569;">
//                                 Configured At: {{formatDate configuredAt}}
//                             </div>
//                             <div style="margin-top:5px; font-family:monospace; font-size:8.5pt; background:#f8fafc; padding:6px; border-radius:4px;">
//                                 {{#each configurations}}
//                                 <span style="text-transform: capitalize; font-weight:bold; color:#64748b;">{{@key}}:</span> {{this}}<br>
//                                 {{/each}}
//                             </div>
//                         </td>
//                         <td class="text-right bold" style="vertical-align: middle;">{{../currency}} {{this.configurations.price}}</td>
//                     </tr>
//                     {{/each}}
//                 </tbody>
//             </table>

//             <div class="terms-box">
//                 <strong>Terms & Conditions:</strong><br>
//                 {{terms_conditions}}
//                 {{#if notes}}
//                 <div style="margin-top:8px; border-top:1px dashed #cbd5e1; padding-top:4px;">
//                     <strong>Notes:</strong> {{notes}}
//                 </div>
//                 {{/if}}
//             </div>

//             <div class="totals-box">
//                 <table class="totals-table">
//                     <tr>
//                         <td>Gross Subtotal:</td>
//                         <td class="text-right">{{currency}} {{total_amount}}</td>
//                     </tr>
//                     <tr>
//                         <td style="color:#16a34a;" class="bold">Amount Paid:</td>
//                         <td class="text-right bold" style="color:#16a34a;">{{currency}} {{paid_amount}}</td>
//                     </tr>
//                     <tr style="background:#fef2f2;">
//                         <td style="color:#dc2626;" class="bold">Balance Outstanding:</td>
//                         <td class="text-right bold" style="color:#dc2626;">{{currency}} {{rest_amount}}</td>
//                     </tr>
//                 </table>
//             </div>

//             <div class="footer-note">
//                 <p>This is a system auto-generated computer document profile track. Signature representation is not required.</p>
//                 <p style="margin-top:3px;">© 2026 KLAR TRAVELS. All Rights Reserved.</p>
//             </div>
//         </div>
//     </body>
//     </html>
//     `;

//     return handlebars.compile(templateHtml)(invoice);
//   }
// };



























import { CreateLeadStageInvoicePayload } from '../interfaces/leadStageInvoice.interface';
import { leadStageInvoiceRepository } from '../repositories/leadStageInvoice.repository';
import { leadStageInvoicePdfService } from './leadStageInvoice-pdf.service';
import { s3UploadService } from './s3-upload.service';
import { processPDFDelivery } from '../helpers/pdfDelivery.helper';

export const leadStageInvoiceService = {
  /**
   * Enforces business edge cases and processes safe system string identifiers
   */
  async createInvoiceFromVoucher(payload: CreateLeadStageInvoicePayload) {
    if (!payload.voucher_id || !payload.lead_id || !payload.lead_name) {
      throw new Error('Validation exception: voucher_id, lead_id, and lead_name are required inputs.');
    }

    if (payload.paid_amount < 0 || payload.voucher_total <= 0) {
      throw new Error('Validation exception: Numerical currency amounts cannot be negative values.');
    }

    const sequentialInvoiceNumber = `INV-LS-${Date.now()}`;

    const extendedPayload = {
      ...payload,
      invoice_number: sequentialInvoiceNumber,
      status: payload.rest_amount <= 0 ? 'paid' : payload.paid_amount > 0 ? 'partial' : 'sent',
      created_at: new Date().toISOString()
    };

    return await leadStageInvoiceRepository.insertInvoiceRecord(extendedPayload);
  },


  /**
   * Validates parameters and handles response data normalization for the client
   */
  async fetchAllInvoicesPaginated(params: { page: number; limit: number; sortOrder: 'asc' | 'desc' }) {
    // Sanitize values to prevent array index clipping exceptions
    const sanitizedPage = Math.max(1, params.page);
    const sanitizedLimit = Math.min(Math.max(1, params.limit), 100); // Caps lookups at 100 max rows

    const result = await leadStageInvoiceRepository.getInvoicesPaginated(
      sanitizedPage,
      sanitizedLimit,
      params.sortOrder
    );

    return {
      invoices: result.data,
      pagination: {
        total_count: result.count,
        page: sanitizedPage,
        limit: sanitizedLimit,
        total_pages: Math.ceil((result.count || 0) / sanitizedLimit)
      }
    };
  },


  /**
   * Interfaces with separate document-pdf helper to output print-ready streams
   */
  async generateInvoicePDFBuffer(invoiceId: string): Promise<{ buffer: Buffer; invoiceNumber: string }> {
    const invoice = await leadStageInvoiceRepository.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Target invoice matching trace criteria does not exist.');

    const buffer = await leadStageInvoicePdfService.generatePDFBuffer(invoice);

    return {
      buffer,
      invoiceNumber: invoice.invoice_number
    };
  },

  /**
   * Generates public cloud storage access URIs and drops data footprints to target communication channels
   */
  async shareAndDeliverInvoice(invoiceId: string, sendVia: any) {
    const invoice = await leadStageInvoiceRepository.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Target invoice record does not exist across active contexts.');

    const htmlContent = await leadStageInvoicePdfService.compileInvoiceHTML(invoice);
    const buffer = await leadStageInvoicePdfService.generatePDFBuffer(invoice);

    const clientSanitizedName = invoice.lead_name.replace(/\s+/g, '_') || 'client';
    const fileName = `invoice_${invoice.invoice_number}_${clientSanitizedName}.pdf`;

    const publicUrl = await s3UploadService.uploadToS3(buffer, fileName);

    const deliveryOptions = {
      leadId: invoice.lead_id,
      clientName: invoice.lead_name,
      clientEmail: invoice.lead_email,
      clientPhone: invoice.lead_phone,
      pdfUrl: publicUrl,
      pdfFileName: fileName,
      htmlContent: htmlContent
    };

    const deliveryResult = await processPDFDelivery(deliveryOptions, sendVia);

    return {
      publicUrl,
      leadId: invoice.lead_id,
      clientPhone: invoice.lead_phone,
      clientEmail: invoice.lead_email,
      deliveryResult
    };
  },

  /**
   * Purges tracking metrics data out of the system
   */
  async deleteInvoiceRecord(invoiceId: string) {
    return await leadStageInvoiceRepository.deleteInvoiceRecord(invoiceId);
  },

  
  /**
   * Fetches data metrics and runs it through the separated PDF Handlebars engine layer
   */
  async getCompiledInvoiceHtmlString(invoiceId: string): Promise<string> {
    const invoice = await leadStageInvoiceRepository.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('No transaction tracking invoice record found matching UUID criteria.');
    }

    // Call compile method inside your separate leadStageInvoice-pdf.service file
    return await leadStageInvoicePdfService.compileInvoiceHTML(invoice);
  }
};