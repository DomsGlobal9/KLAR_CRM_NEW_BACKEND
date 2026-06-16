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
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await leadStageVoucherService.getAllVouchers(page, limit);
      
      res.status(200).json({
        success: true,
        data: result.vouchers,
        pagination: {
          page,
          limit,
          total_pages: result.totalPages,
          total_count: result.totalCount
        }
      });
    } catch (error: any) {
      console.error("❌ Lead Stage Voucher paginated retrieval failure:", error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve vouchers list'
      });
    }
  },



  /**
   * Fetch a single voucher setup requirement profile by ID
   */
  async getVoucherById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const voucher = await leadStageVoucherService.getVoucherById(id);

      res.status(200).json({
        success: true,
        data: voucher
      });
    } catch (error: any) {
      console.error("❌ Lead Stage Voucher single record fetch failure:", error);
      res.status(404).json({
        success: false,
        error: error.message || 'The requested voucher layout profile could not be found'
      });
    }
  }
};