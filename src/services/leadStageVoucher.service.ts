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
  }, 

  /**
   * Retrieve all vouchers
   */
  async getAllVouchers(page: number, limit: number) {
    return await leadStageVoucherRepository.getAllVouchers(page, limit);
  },


  /**
   * Business logic routing handler to fetch a single voucher record
   */
  async getVoucherById(id: string) {
    if (!id) {
      throw new Error('Validation failed: Voucher ID parameter is strictly required.');
    }
    
    const voucher = await leadStageVoucherRepository.getVoucherById(id);
    if (!voucher) {
      throw new Error(`Data anomaly: No voucher found matching ID: ${id}`);
    }

    // return voucher;
     return await leadStageVoucherRepository.getVoucherById(id);
  },

};