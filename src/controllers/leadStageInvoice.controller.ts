import { Request, Response } from 'express';
import { leadStageInvoiceService } from '../services/leadStageInvoice.service';
import { sendErrorResponse, sendUploadResponse } from '../helpers/response.helper';

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
  },

  /**
   * GET /api/lead-stage-invoice/all
   * Supports Query Params: ?page=1&limit=10&sort_order=desc
   */
  async getAllInvoices(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortOrder = (req.query.sort_order as 'asc' | 'desc') || 'desc';

      const result = await leadStageInvoiceService.fetchAllInvoicesPaginated({
        page,
        limit,
        sortOrder
      });

      return res.status(200).json({
        success: true,
        message: 'Lead stage invoices fetched successfully from database records',
        data: result.invoices,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error("❌ Fetch all invoices layer failure:", error);
      return res.status(500).json({
        success: false,
        error: error.message || 'An error occurred during invoice stream lookups.'
      });
    }
  },

  async getInvoiceById(req: Request, res: Response) {
    try {
      const { invoice_id } = req.params;

      if (!invoice_id) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID parameter is required'
        });
      }

      const invoice = await leadStageInvoiceService.getInvoiceRecordById(invoice_id);

      return res.status(200).json({
        success: true,
        message: 'Lead stage invoice record retrieved successfully',
        data: invoice
      });
    } catch (error: any) {
      console.error("❌ Single invoice lookup fault layer exception:", error);
      
      const status = error.message.includes('not found') ? 404 : 500;
      return res.status(status).json({
        success: false,
        error: error.message || 'An error occurred during transaction matrix lookups.'
      });
    }
  },    


  /**
   * Compiles dynamic template syntax directly into binary data arrays streamed to client
   */
  async downloadInvoicePDF(req: Request, res: Response) {
    try {
      const { invoice_id } = req.params;

      if (!invoice_id) {
        return res.status(400).json({ success: false, message: 'Invoice ID param token required.' });
      }

      const { buffer, invoiceNumber } = await leadStageInvoiceService.generateInvoicePDFBuffer(invoice_id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoiceNumber}.pdf"`);
      return res.send(buffer);
    } catch (error: any) {
      console.error("❌ Invoice PDF extraction stream failure:", error);
      return res.status(500).json({ success: false, error: error.message || 'PDF Generation Fault' });
    }
  },

  /**
   * Uploads invoice asset to AWS S3 bucket architecture and dispatches documents across requested channels
   */
  async shareInvoiceDocument(req: Request, res: Response) {
    try {
      const { invoice_id } = req.params;
      const { sendVia } = req.body; // Structure format context: { email: boolean, whatsapp: boolean }

      if (!invoice_id) {
        return res.status(400).json({ success: false, message: 'Invoice ID is required' });
      }

      const result = await leadStageInvoiceService.shareAndDeliverInvoice(invoice_id, sendVia);

      return sendUploadResponse(res, {
        success: true,
        publicUrl: result.publicUrl,
        leadId: result.leadId,
        clientPhone: result.clientPhone,
        clientEmail: result.clientEmail,
        deliveryResult: result.deliveryResult
      });
    } catch (error: any) {
      console.error("❌ Invoice asset distribution workflow fault:", error);
      return sendErrorResponse(res, error);
    }
  },

  /**
   * Safely traces down records and wipes row state models completely out of database contexts
   */
  async deleteInvoiceRecord(req: Request, res: Response) {
    try {
      const { invoice_id } = req.params;

      if (!invoice_id) {
        return res.status(400).json({ success: false, message: 'Invoice identification parameter missing.' });
      }

      await leadStageInvoiceService.deleteInvoiceRecord(invoice_id);

      return res.status(200).json({
        success: true,
        message: 'Lead stage invoice asset deleted permanently from cloud clusters'
      });
    } catch (error: any) {
      console.error("❌ Delete tracking pipeline map failure:", error);
      return res.status(400).json({ success: false, error: error.message || 'Deletion Exception Execute.' });
    }
  },

  /**
   * GET /api/lead-stage-invoice/:invoice_id/preview
   * Query Param: ?preview=true (Returns clean HTML view)
   * Default: Returns application/pdf download stream
   */
  async getInvoicePreviewOrPDF(req: Request, res: Response) {
    try {
      const { invoice_id } = req.params;
      const previewHtml = req.query.preview === 'true';

      if (!invoice_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invoice identifier token is missing from parameters.' 
        });
      }

      // 1. If user just wants to inspect the raw HTML template engine styling
      if (previewHtml) {
        const html = await leadStageInvoiceService.getCompiledInvoiceHtmlString(invoice_id);
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
      }

      // 2. Default: Compile Puppeteer buffer and stream down the PDF structure
      const { buffer, invoiceNumber } = await leadStageInvoiceService.generateInvoicePDFBuffer(invoice_id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Invoice_${invoiceNumber}.pdf"`);
      return res.send(buffer);

    } catch (error: any) {
      console.error("❌ Lead Stage Invoice PDF retrieval fault:", error);
      return res.status(500).json({
        success: false,
        error: error.message || 'An error occurred during template calculation matrices.'
      });
    }
  }
};