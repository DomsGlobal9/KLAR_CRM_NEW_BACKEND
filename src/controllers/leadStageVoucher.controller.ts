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
    }
};