import { Request, Response } from 'express';
import { invoiceService } from '../services';
import { CreateInvoiceDTO, UpdateInvoiceDTO } from '../interfaces/invoice.interface';

export const invoiceController = {

    async getAllInvoices(req: Request, res: Response) {
        try {
            const invoices = await invoiceService.getAllInvoices();
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
            const invoiceData: CreateInvoiceDTO = req.body;
            const invoice = await invoiceService.createInvoice(invoiceData);
            res.status(201).json({ success: true, data: invoice });
        } catch (error: any) {
            res.status(400).json({ 
                success: false, 
                message: error.message || 'Failed to create invoice' 
            });
        }
    },

    async updateInvoice(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData: UpdateInvoiceDTO = req.body;
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

    async deleteInvoice(req: Request, res: Response) {
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
    }
};