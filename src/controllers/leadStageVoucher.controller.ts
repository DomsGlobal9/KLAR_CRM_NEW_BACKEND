import { Request, Response } from 'express';
import { leadStageVoucherService } from '../services/leadStageVoucher.service';

export const leadStageVoucherController = {
    /**
     * Handle Lead Voucher form post request payload submission pipelines
     */
    async submitVoucherDetails(req: Request, res: Response) {
        try {
            const payload = req.body;
            const result = await leadStageVoucherService.submitVoucherDetails(payload);

            res.status(201).json({
                success: true,
                message: 'Lead stage voucher configurations saved successfully to Supabase',
                data: result
            });
        } catch (error: any) {
            console.error("❌ Lead Stage Voucher submission failure:", error);
            res.status(400).json({
                success: false,
                error: error.message || 'An explicit data storage error occurred'
            });
        }
    },


    /**
   * Fetch all vouchers recorded inside Supabase
   */
  async getAllVouchers(req: Request, res: Response) {
    try {
      const vouchers = await leadStageVoucherService.getAllVouchers();
      
      res.status(200).json({
        success: true,
        data: vouchers
      });
    } catch (error: any) {
      console.error("❌ Lead Stage Voucher retrieval failure:", error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve vouchers list'
      });
    }
  }
};