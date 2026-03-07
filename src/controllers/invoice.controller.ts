import { Request, Response } from 'express';
import { invoiceService } from '../services';
import { ICreateInvoiceDTO, IUpdateInvoiceDTO } from '../interfaces/invoice.interface';
import { generateInvoiceNumber, parseClientString } from '../utils/date.utils';
import { AuthRequest } from '../middleware';

export const invoiceController = {

    async getAllInvoices(req: AuthRequest, res: Response) {
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
    },

    async getInvoiceById(req: Request, res: Response) {
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
    },

    async createInvoice(req: Request, res: Response) {
        try {
            const invoiceData: any = req.body;


            // Smart Fallback: If this payload looks like a quote conversion (has quote_number and client string but no client_name)
            if (invoiceData.quote_number && !invoiceData.client_name && (invoiceData.client || invoiceData.quote_currency)) {
                console.log('>>> Detected quote conversion payload in generic createInvoice endpoint. Redirecting to convertQuoteToInvoice...');
                return await invoiceController.convertQuoteToInvoice(req, res);
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
    },

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
    },

    async deleteInvoice(req: AuthRequest, res: Response) {
        const userRole = req.user?.role;
        if( userRole != 'superadmin' ) {
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
            if (error.message === 'Invoice not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({
                    success: false,
                    message: error.message || 'Failed to delete invoice'
                });
            }
        }
    },

    async getInvoiceStats(req: Request, res: Response) {
        try {
            const stats = await invoiceService.getInvoiceStats();
            res.json({ success: true, data: stats });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch invoice stats'
            });
        }
    },

    async markAsPaid(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const invoice = await invoiceService.markInvoiceAsPaid(id as string);
            res.json({ success: true, data: invoice, message: 'Invoice marked as paid' });
        } catch (error: any) {
            if (error.message === 'Invoice not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to update invoice status'
                });
            }
        }
    },

    async markAsSent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const invoice = await invoiceService.markInvoiceAsSent(id as string);
            res.json({ success: true, data: invoice, message: 'Invoice marked as sent' });
        } catch (error: any) {
            if (error.message === 'Invoice not found') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(400).json({
                    success: false,
                    message: error.message || 'Failed to update invoice status'
                });
            }
        }
    },

    async convertQuoteToInvoice(req: Request, res: Response) {
        try {
            const quoteData = req.body;

            console.log('Received quote data:', JSON.stringify(quoteData, null, 2));

            const clientInfo = parseClientString(quoteData.client);
            console.log('Parsed client info:', clientInfo);

            // Due date fixed at 30 days from today (frontend does not send payment_deadline)
            const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            const dueDateTime = '23:59';

            // Log cash payment breakdown from frontend (informational)
            if (quoteData.payment_method === 'Cash') {
                console.log('Cash payment details:', {
                    payment_type: quoteData.payment_type,   
                    paid_percentage: quoteData.paid_percentage, 
                    paid_amount: quoteData.paid_amount,    
                    rest_amount: quoteData.rest_amount,    
                });
            }

            const invoiceNumber = generateInvoiceNumber(quoteData.quote_number);
            console.log('Generated invoice number:', invoiceNumber);

            const invoiceData: ICreateInvoiceDTO = {
                invoice_number: invoiceNumber,
                quote_number: quoteData.quote_number,
                client_name: clientInfo.name,
                client_email: clientInfo.email,
                client_phone: quoteData.client_mobile,
                billing_address: quoteData.billing_address,
                total: quoteData.quote_total || 0,
                currency: quoteData.quote_currency || 'INR',
                status: quoteData.send_invoice === true || quoteData.send_invoice === 'Yes' ? 'sent' : 'draft',
                due_date: dueDate,
                due_date_time: dueDateTime,
                quote_reference: quoteData.quote_reference || quoteData.quote_number,
                payment_method: quoteData.payment_method?.toLowerCase(),
                paid_amount: quoteData.paid_amount ? parseFloat(String(quoteData.paid_amount)) : 0,
                gst_number: quoteData.gst_number,
                paid_percentage: quoteData.paid_percentage,
                payment_type: quoteData.payment_type,
                rest_amount: quoteData.rest_amount,
                include_quote_details: quoteData.include_quote_details === true ||
                    quoteData.include_quote_details === 'Yes',
                line_items: quoteData.line_items || [],
                notes: quoteData.notes,
                terms_conditions: quoteData.terms_conditions
            };

            console.log('Creating invoice with data:', JSON.stringify(invoiceData, null, 2));

            const invoice = await invoiceService.createInvoice(invoiceData, true);

            if (quoteData.send_invoice === true || quoteData.send_invoice === 'Yes') {
                await invoiceService.markInvoiceAsSent(invoice.id);
            }

            res.status(201).json({
                success: true,
                message: quoteData.send_invoice ?
                    'Invoice created and sent successfully' :
                    'Invoice created successfully',
                data: invoice,
            });

        } catch (error: any) {
            console.error('Error converting quote to invoice:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to convert quote to invoice'
            });
        }
    }
};