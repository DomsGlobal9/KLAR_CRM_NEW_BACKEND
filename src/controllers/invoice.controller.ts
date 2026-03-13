import { Request, Response } from 'express';
import { invoiceRepository } from '../repositories';
import { invoiceService } from '../services';
import { ICreateInvoiceDTO, IUpdateInvoiceDTO } from '../interfaces/invoice.interface';
import { parseClientString, parseBoolean } from '../utils/parser.util';
import { generateInvoiceNumber } from '../utils/date.utils';
import { AppError } from '../utils/errorHandler';
import { AuthRequest } from '../middleware';
import { pdfService } from '../services/invoicePdf.service';


import { supabaseAdmin } from '../config';

export class InvoiceController {

    /**
     * Main entry point for quote conversion (legacy name for compatibility or new flow)
     */
    convertQuoteToInvoice = async (req: Request, res: Response): Promise<Response> => {
        return this.createOrUpdateInvoice(req, res);
    }

    /**
     * Create or update invoice based on quote_number
     */
    createOrUpdateInvoice = async (req: Request, res: Response): Promise<Response> => {
        const startTime = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        try {
            const payload = req.body;

            console.log(`[${requestId}] Processing invoice request for quote: ${payload.quote_number}`);

            if (!payload.quote_number) {
                throw new AppError('Quote number is required', 400, 'MISSING_QUOTE_NUMBER');
            }

            // Check for existing invoice
            const existingInvoice = await invoiceRepository.findByQuoteNumber(payload.quote_number);

            // Parse client information
            const clientInfo = this.parseClientInformation(payload);

            // Calculate financial values
            const financials = this.calculateFinancials(payload, existingInvoice);

            // Validate business rules
            this.validateBusinessRules(payload, financials, existingInvoice);

            let result;
            let statusCode: number;
            let action: 'created' | 'updated';

            if (existingInvoice) {
                // UPDATE existing invoice
                result = await this.updateExistingInvoice(
                    existingInvoice,
                    payload,
                    clientInfo,
                    financials,
                    requestId,
                    req as AuthRequest
                );
                statusCode = 200;
                action = 'updated';

                console.log(`[${requestId}] Invoice updated: ${existingInvoice.id}`);
            } else {
                // CREATE new invoice
                result = await this.createNewInvoice(
                    payload,
                    clientInfo,
                    financials,
                    requestId,
                    req as AuthRequest
                );
                statusCode = 201;
                action = 'created';

                console.log(`[${requestId}] Invoice created: ${result.id}`);
            }

            // Handle sending invoice if requested
            if (this.shouldSendInvoice(payload)) {
                await invoiceService.markInvoiceAsSent(result.id);
            }

            // Prepare response
            const response = this.prepareResponse(result, financials, action, existingInvoice);

            return res.status(statusCode).json({
                success: true,
                ...response
            });

        } catch (error: any) {
            console.error(`[${requestId}] Invoice processing failed:`, error);

            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                    error: {
                        code: error.code,
                        message: error.message
                    }
                });
            }

            return res.status(500).json({
                success: false,
                message: error.message || 'An unexpected error occurred',
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message
                }
            });
        }
    }

    getAllInvoices = async (req: AuthRequest, res: Response) => {
        try {
            const userDetails = req.user;
            const userRole = userDetails?.role;
            const userId = userDetails?.id;

            const invoices = await invoiceService.getAllInvoices(userRole, userId);
            res.json({ success: true, data: invoices });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch invoices'
            });
        }
    }

    getInvoiceById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const invoice = await invoiceService.getInvoiceById(id as string);
            res.json({ success: true, data: invoice });
        } catch (error: any) {
            if (error.message === 'Invoice not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({
                    success: false,
                    message: error.message || 'Failed to fetch invoice'
                });
            }
        }
    }

    async createInvoice(req: Request, res: Response) {
        try {
            const invoiceData: any = req.body;


            // Smart Fallback: If this payload looks like a quote conversion (has quote_number and client string but no client_name)
            if (invoiceData.quote_number && !invoiceData.client_name && (invoiceData.client || invoiceData.quote_currency)) {
                console.log('>>> Detected quote conversion payload in generic createInvoice endpoint. Redirecting to convertQuoteToInvoice...');
                return await this.convertQuoteToInvoice(req, res);
            }

            const invoice = await invoiceService.createInvoice(invoiceData as ICreateInvoiceDTO);
            res.status(201).json({ success: true, data: invoice });
        } catch (error: any) {
            console.error('Error in createInvoice:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create invoice'
            });
        }
    }

    async updateInvoice(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData: IUpdateInvoiceDTO = req.body;
            const invoice = await invoiceService.updateInvoice(id as string, updateData);
            res.json({ success: true, data: invoice });
        } catch (error: any) {
            if (error.message === 'Invoice not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to update invoice'
                });
            }
        }
    }

    async deleteInvoice(req: AuthRequest, res: Response) {
        const userRole = req.user?.role;
        if (userRole != 'superadmin') {
            return res.status(400).json({
                success: false,
                message: 'You are not authorized'
            });
        }

        try {
            const { id } = req.params;
            const result = await invoiceService.deleteInvoice(id as string);
            res.json(result);
        } catch (error: any) {
            const status = error.message === 'Invoice not found' ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    getInvoiceStats = async (req: Request, res: Response) => {
        try {
            const stats = await invoiceService.getInvoiceStats();
            res.json({ success: true, data: stats });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    markAsPaid = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const invoice = await invoiceService.markInvoiceAsPaid(id as string);
            res.json({ success: true, data: invoice, message: 'Invoice marked as paid' });
        } catch (error: any) {
            const status = error.message === 'Invoice not found' ? 404 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    markAsSent = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const invoice = await invoiceService.markInvoiceAsSent(id as string);
            res.json({ success: true, data: invoice, message: 'Invoice marked as sent' });
        } catch (error: any) {
            const status = error.message === 'Invoice not found' ? 404 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /**
     * Parse client information from various formats
     */
    private parseClientInformation(payload: any): { name: string; email: string } {
        if (payload.client_name) {
            return {
                name: payload.client_name,
                email: payload.client_email || ''
            };
        }
        if (payload.client) {
            return parseClientString(payload.client);
        }
        return { name: '', email: '' };
    }

    /**
     * Calculate all financial values
     */
    private calculateFinancials(payload: any, existingInvoice: any | null): any {
        const total = payload.quote_total || payload.total || 0;

        if (total <= 0) {
            throw new AppError('Total amount must be greater than 0', 400, 'INVALID_TOTAL');
        }

        let paidAmount = 0;
        if (payload.payment_type === 'percentage' && payload.paid_percentage) {
            paidAmount = (total * payload.paid_percentage) / 100;
        } else if (payload.paid_amount) {
            paidAmount = Number(payload.paid_amount);
        }

        paidAmount = Math.round(paidAmount * 100) / 100;

        const currentPaid = existingInvoice?.paid_amount || 0;
        const newPaidAmount = existingInvoice
            ? Math.round((currentPaid + paidAmount) * 100) / 100
            : paidAmount;

        const status = this.determineStatus(newPaidAmount, total, existingInvoice?.status);

        return {
            total,
            paidAmount,
            currentPaid,
            newPaidAmount,
            remainingBalance: Math.round((total - newPaidAmount) * 100) / 100,
            newPaidPercentage: Math.round((newPaidAmount / total) * 100 * 100) / 100,
            status,
            isFullyPaid: newPaidAmount >= total,
            isPartial: newPaidAmount > 0 && newPaidAmount < total
        };
    }

    private determineStatus(newPaidAmount: number, total: number, currentStatus?: string): string {
        if (newPaidAmount >= total) return 'paid';
        if (newPaidAmount > 0) return 'partial';
        return currentStatus || 'draft';
    }

    private validateBusinessRules(payload: any, financials: any, existingInvoice: any | null): void {
        if (financials.newPaidAmount > financials.total + 0.01) { // small buffer for floating point
            throw new AppError('Payment amount cannot exceed invoice total', 400, 'PAYMENT_EXCEEDS_TOTAL');
        }
        if (existingInvoice?.status === 'paid') {
            throw new AppError('Cannot add payment to already paid invoice', 400, 'INVOICE_ALREADY_PAID');
        }
        if (financials.paidAmount > 0 && !payload.payment_method) {
            throw new AppError('Payment method is required when making a payment', 400, 'PAYMENT_METHOD_REQUIRED');
        }
    }

    private updateExistingInvoice = async (
        existingInvoice: any,
        payload: any,
        clientInfo: { name: string; email: string },
        financials: any,
        requestId: string,
        req: AuthRequest
    ): Promise<any> => {
        const updateData: IUpdateInvoiceDTO = {
            paid_amount: financials.newPaidAmount,
            paid_percentage: financials.newPaidPercentage,
            rest_amount: financials.remainingBalance,
            status: financials.status as any,
            paid_date: financials.isFullyPaid ? new Date().toISOString() : existingInvoice.paid_date,
            payment_method: payload.payment_method?.toLowerCase() || existingInvoice.payment_method,
            client_name: clientInfo.name || existingInvoice.client_name,
            client_email: clientInfo.email || existingInvoice.client_email,
            client_phone: payload.client_mobile || existingInvoice.client_phone,
            billing_address: payload.billing_address || existingInvoice.billing_address,
            notes: payload.notes || existingInvoice.notes,
            terms_conditions: payload.terms_conditions || existingInvoice.terms_conditions,
        };

        // Remove undefined
        Object.keys(updateData).forEach(key => (updateData as any)[key] === undefined && delete (updateData as any)[key]);

        return await invoiceRepository.update(existingInvoice.id, updateData);
    }

    private createNewInvoice = async (
        payload: any,
        clientInfo: { name: string; email: string },
        financials: any,
        requestId: string,
        req: AuthRequest
    ): Promise<any> => {
        const invoiceNumber = generateInvoiceNumber(payload.quote_number);
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const invoiceData: ICreateInvoiceDTO = {
            invoice_number: invoiceNumber,
            quote_number: payload.quote_number,
            client_name: clientInfo.name,
            client_email: clientInfo.email,
            client_phone: payload.client_mobile,
            billing_address: payload.billing_address,
            total: financials.total,
            currency: payload.quote_currency || payload.currency || 'INR',
            status: financials.status as any,
            due_date: dueDate,
            due_date_time: '23:59',
            payment_method: payload.payment_method?.toLowerCase(),
            paid_amount: financials.paidAmount,
            gst_number: payload.gst_number,
            paid_percentage: payload.paid_percentage,
            payment_type: payload.payment_type,
            rest_amount: financials.remainingBalance,
            include_quote_details: parseBoolean(payload.include_quote_details),
            line_items: payload.line_items || [],
            notes: payload.notes,
            terms_conditions: payload.terms_conditions,
            created_at: new Date().toISOString(),
        };

        // Skip validation for conversions since we trust the data and use fallbacks
        return await invoiceService.createInvoice(invoiceData, true);
    }

    private shouldSendInvoice(payload: any): boolean {
        return parseBoolean(payload.send_invoice);
    }

    private prepareResponse(invoice: any, financials: any, action: 'created' | 'updated', existingInvoice?: any): any {
        return {
            message: financials.isFullyPaid ? 'Invoice has been fully paid' : `Invoice ${action} successfully`,
            data: invoice,
            action,
            payment_details: {
                amount_paid: financials.paidAmount,
                total_paid: financials.newPaidAmount,
                remaining_balance: financials.remainingBalance,
                status: financials.status,
                is_fully_paid: financials.isFullyPaid
            }
        };
    }







    // Add this to your InvoiceController class
    downloadInvoicePDF = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const invoice = await invoiceService.getInvoiceById(id);

            // 1. Generate HTML & PDF
            const html = await pdfService.generateInvoiceHTML(invoice);
            const pdfBuffer = await pdfService.generatePDF(html);

            // 2. (Optional) Store in Supabase Storage
            const fileName = `invoices/${invoice.invoice_number}.pdf`;
            await supabaseAdmin.storage
                .from('documents')
                .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true });

            // 3. Send Response
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoice_number}.pdf`);
            return res.send(pdfBuffer);

        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

}

export const invoiceController = new InvoiceController();