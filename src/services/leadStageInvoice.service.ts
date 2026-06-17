import { CreateLeadStageInvoicePayload } from '../interfaces/leadStageInvoice.interface';
import { leadStageInvoiceRepository } from '../repositories/leadStageInvoice.repository';

export const leadStageInvoiceService = {
  /**
   * Enforces business edge cases and processes safe system string identifiers
   */
  async createInvoiceFromVoucher(payload: CreateLeadStageInvoicePayload) {
    // Core property validation sanity checklist
    if (!payload.voucher_id || !payload.lead_id || !payload.lead_name) {
      throw new Error('Validation exception: voucher_id, lead_id, and lead_name are required inputs.');
    }

    if (payload.paid_amount < 0 || payload.voucher_total <= 0) {
      throw new Error('Validation exception: Numerical currency amounts cannot be negative values.');
    }

    // Auto-serialize a clean human-readable invoice reference tracker sequence matching standard workflows
    const sequentialInvoiceNumber = `INV-LS-${Date.now()}`;

    const extendedPayload = {
      ...payload,
      invoice_number: sequentialInvoiceNumber,
      status: payload.rest_amount <= 0 ? 'paid' : payload.paid_amount > 0 ? 'partial' : 'sent',
      created_at: new Date().toISOString()
    };

    return await leadStageInvoiceRepository.insertInvoiceRecord(extendedPayload);
  }
};