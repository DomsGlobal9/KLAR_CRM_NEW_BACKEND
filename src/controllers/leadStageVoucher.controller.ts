import { Request, Response } from 'express';
import { leadStageVoucherService } from '../services/leadStageVoucher.service';
import { leadStageVoucherPdfService } from '../services/leadStageVoucherPdf.service';
import { s3UploadService } from '../services/s3-upload.service';
import { processPDFDelivery, formatDeliveryResponse } from '../helpers/pdfDelivery.helper';
import { sendUploadResponse, sendErrorResponse } from '../helpers/response.helper';

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
  },

//   async getVoucherById(req: Request, res: Response) {
//     try {
//       const id = req.params.id as string;
//       const voucher = await leadStageVoucherService.getVoucherById(id);
//       res.status(200).json({ success: true, data: voucher });
//     } catch (error: any) {
//       res.status(404).json({ success: false, error: error.message });
//     }
//   },



/**
 * Generates and serves the voucher PDF inline directly to the browser view
 */
async previewVoucherPDF(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    // 1. Fetch live metadata from database
    const voucherData = await leadStageVoucherService.getVoucherById(id);
    if (!voucherData) {
      return res.status(404).json({ success: false, message: "Voucher dataset not found" });
    }

    // 2. Compile HTML layouts and pass to Puppeteer to get the binary buffer
    const html = await leadStageVoucherPdfService.generateHTML(voucherData);
    const buffer = await leadStageVoucherPdfService.generateBuffer(html);

    // 3. Set content type to PDF and display inline inside the browser tab
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="voucher_preview.pdf"');
    
    return res.send(buffer);
  } catch (error: any) {
    console.error("❌ Voucher PDF Preview loop failure:", error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to render PDF preview window.'
    });
  }
},



  /**
   * Compiles Voucher layout to PDF, uploads to S3 bucket, and sends via selected channels
   */
  async shareVoucherRequirements(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { sendVia } = req.body; // e.g., { email: true, whatsapp: true }

      // 1. Fetch live metadata from database
      const voucherData = await leadStageVoucherService.getVoucherById(id);
      if (!voucherData) {
        return res.status(404).json({ success: false, message: "Voucher dataset not found" });
      }

      // 2. Compile raw HTML payload layouts and push to Puppeteer buffer streams
      const html = await leadStageVoucherPdfService.generateHTML(voucherData);
      const buffer = await leadStageVoucherPdfService.generateBuffer(html);

      // 3. Serialize safe alphanumeric filename and upload to Amazon AWS S3 Buckets
      const cleanClientName = voucherData.lead_name?.replace(/\s+/g, '_') || 'client';
      const fileName = `voucher_${id}_${cleanClientName}.pdf`;
      const publicUrl = await s3UploadService.uploadToS3(buffer, fileName);

      // 4. Wrap configurations and execute multi-channel deliveries using pdfDeliveryService pipeline
      const deliveryOptions = {
        leadId: voucherData.lead_id,
        clientName: voucherData.lead_name || 'Client',
        clientEmail: voucherData.lead_email,
        clientPhone: voucherData.lead_phone,
        pdfUrl: publicUrl,
        pdfFileName: fileName,
        htmlContent: html,
      };

      const deliveryResult = await processPDFDelivery(deliveryOptions, sendVia);

      return sendUploadResponse(res, {
        success: true,
        publicUrl,
        leadId: voucherData.lead_id,
        clientPhone: voucherData.lead_phone,
        clientEmail: voucherData.lead_email,
        deliveryResult: formatDeliveryResponse(deliveryResult, voucherData.lead_phone, voucherData.lead_email)
      });

    } catch (error: any) {
      console.error("❌ Voucher sharing processing loop failure:", error);
      return res.status(500).json({
        success: false,
        error: error.message || 'An internal error occurred during voucher delivery optimization loops.'
      });
    }
  }, 
  

  /**
 * Generates and forces the browser to download the voucher PDF as an attachment
 */
async downloadVoucherPDF(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    // 1. Fetch live metadata from database
    const voucherData = await leadStageVoucherService.getVoucherById(id);
    if (!voucherData) {
      return res.status(404).json({ success: false, message: "Voucher dataset not found" });
    }

    // 2. Compile HTML layouts and pass to Puppeteer to get the binary buffer
    const html = await leadStageVoucherPdfService.generateHTML(voucherData);
    const buffer = await leadStageVoucherPdfService.generateBuffer(html);

    // 3. Set content type to PDF and use "attachment" to force download
    const cleanClientName = voucherData.lead_name?.replace(/\s+/g, '_').toLowerCase() || 'client';
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="voucher_${id}_${cleanClientName}.pdf"`);
    
    return res.send(buffer);
  } catch (error: any) {
    console.error("❌ Voucher PDF Download loop failure:", error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate downloadable PDF file.'
    });
  }
}
};