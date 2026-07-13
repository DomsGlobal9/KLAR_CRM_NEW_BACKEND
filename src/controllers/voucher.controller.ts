import { Request, Response } from 'express';
import { voucherService } from '../services/voucher.service';
import { voucherPdfService } from '../services/voucher-pdf.service';
import { s3UploadService } from '../services/s3-upload.service';
import { processPDFDelivery, formatDeliveryResponse } from '../helpers/pdfDelivery.helper';

export const voucherController = {
    /**
     * Generate an automated tracking number signature with a VC prefix
     */
    async generateVoucherNumber(req: Request, res: Response) {
        try {
            const result = await voucherService.generateVoucherNumber();
            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in generateVoucherNumber controller:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    /**
     * View voucher data preview derived from a Quote ID
     */
    async getVoucherByQuoteId(req: Request, res: Response) {
        try {
            const { quoteId } = req.params;
            const result = await voucherService.getVoucherDataByQuoteId(quoteId as string);
            
            if (!result.success) {
                return res.status(404).json(result);
            }
            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error in getVoucherByQuoteId controller:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    /**
     * Direct local download stream engine for Voucher PDF generated via Quote ID
     */
    async downloadVoucherPDF(req: Request, res: Response) {
        try {
            const { quoteId } = req.params;
            const result = await voucherService.getVoucherDataByQuoteId(quoteId as string);
            
            if (!result.success || !result.data) {
                return res.status(404).json({ success: false, message: result.error || "Quote data missing" });
            }

            const html = await voucherPdfService.generateHTML(result.data);
            const buffer = await voucherPdfService.generateBuffer(html);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="Voucher_${result.data.voucher_number}.pdf"`);
            return res.send(buffer);
        } catch (error: any) {
            console.error("Direct voucher download execution fault:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Generates Voucher PDF, pushes to S3, and distributes through Email + WhatsApp
     */
    async shareVoucherPDF(req: Request, res: Response) {
        try {
            const { quoteId } = req.params;
            const { sendVia } = req.body; // Expecting { whatsapp: true, email: true }

            // 1. Fetch Quote data and attach a temporary Voucher number sequence
            const voucherDataResult = await voucherService.getVoucherDataByQuoteId(quoteId as string);
            if (!voucherDataResult.success || !voucherDataResult.data) {
                return res.status(404).json({ success: false, message: voucherDataResult.error || "Data lookup failed" });
            }
            const voucherData = voucherDataResult.data;

            // 2. Compile layout engine elements using handlebars
            const html = await voucherPdfService.generateHTML(voucherData);
            const buffer = await voucherPdfService.generateBuffer(html);

            const clientName = voucherData.client_name?.replace(/\s+/g, '_') || 'client';
            
            // CRITICAL: File name must contain 'voucher' so pdfDeliveryService detects it properly
            const fileName = `voucher_${voucherData.voucher_number}_${clientName}.pdf`;

            // 3. Stage compiled asset chunk cleanly into S3 bucket
            const publicUrl = await s3UploadService.uploadToS3(buffer, fileName);

            // 4. Configure unified multi-channel communication options mapping schema
            const deliveryOptions = {
                leadId: voucherData.lead_id,
                clientName: voucherData.client_name || 'Client',
                clientEmail: voucherData.client_email,
                clientPhone: voucherData.client_phone,
                pdfUrl: publicUrl,
                pdfFileName: fileName,
                htmlContent: html // Passed forward for explicit inline tracking rendering
            };

            const deliveryResult = await processPDFDelivery(deliveryOptions, sendVia);

            return res.status(200).json({
                success: true,
                message: "Voucher processed and distributed successfully",
                data: {
                    voucher_number: voucherData.voucher_number,
                    public_url: publicUrl,
                    lead_id: voucherData.lead_id,
                    delivery: formatDeliveryResponse(deliveryResult, voucherData.client_phone, voucherData.client_email)
                }
            });

        } catch (error: any) {
            console.error("Voucher pipeline processing error trace:", error);
            res.status(500).json({
                success: false,
                message: "Failed to cleanly execute sharing delivery sequence parameters",
                error: error.message
            });
        }
    }
};