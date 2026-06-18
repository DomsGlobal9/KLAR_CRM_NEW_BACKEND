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
   * Get Single Invoice
   */
  async getInvoiceRecordById(invoiceId: string) {
    const invoice = await leadStageInvoiceRepository.getInvoiceById(invoiceId);
    
    if (!invoice) {
      throw new Error(`Lead stage invoice with identifier code ${invoiceId} not found.`);
    }

    return invoice;
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