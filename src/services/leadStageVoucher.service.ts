import { CreateLeadStageVoucherPayload } from '../interfaces/leadStageVoucher.interface';
import { leadStageVoucherRepository } from '../repositories/leadStageVoucher.repository';

export const leadStageVoucherService = {
  /**
   * Process and validate form data values
   */
  async submitVoucherDetails(payload: CreateLeadStageVoucherPayload) {
    if (!payload.leadId || !payload.leadName) {
      throw new Error('Validation failed: leadId and leadName are required parameters.');
    }

    if (!payload.serviceConfigurations || payload.serviceConfigurations.length === 0) {
      throw new Error('Validation failed: serviceConfigurations array cannot be empty.');
    }

    return await leadStageVoucherRepository.createVoucherRecord(payload);
  }
};