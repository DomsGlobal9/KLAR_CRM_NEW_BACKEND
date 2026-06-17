import { Request, Response } from 'express';
import { leadStageInvoiceService } from '../services/leadStageInvoice.service';

export const leadStageInvoiceController = {
  /**
   * Parse form inputs from frontend and route downstream into logic layers
   */
  async generateInvoiceFromVoucher(req: Request, res: Response) {
    try {
      const payload = req.body;
      const result = await leadStageInvoiceService.createInvoiceFromVoucher(payload);

      return res.status(201).json({
        success: true,
        message: 'Lead stage invoice generated and saved successfully to database records',
        data: result
      });
    } catch (error: any) {
      console.error("❌ Lead Stage Invoice conversion fault:", error);
      return res.status(400).json({
        success: false,
        error: error.message || 'An error occurred during invoice persistence pipeline maps'
      });
    }
  }
};