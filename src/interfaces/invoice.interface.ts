export interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    clientAddress?: string;
    subtotal: number;
    discount?: number;
    taxAmount: number;
    total: number;
    currency: string;
    status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
    createdAt: string;
    dueDate: string;
    quoteReference?: string;
    paidAmount: number;
    paidDate?: string;
    sentAt?: string;
    lineItems: LineItem[];
    notes?: string;
    termsConditions?: string;
    gstNumber?: string;
}

export interface CreateInvoiceDTO {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    clientAddress?: string;
    subtotal: number;
    discount?: number;
    taxAmount: number;
    total: number;
    currency: string;
    status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
    dueDate?: string;
    quoteReference?: string;
    lineItems: LineItem[];
    notes?: string;
    termsConditions?: string;
    gstNumber?: string;
}

export interface UpdateInvoiceDTO {
    status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
    paidAmount?: number;
    paidDate?: string;
    sentAt?: string;
    notes?: string;
}

export interface InvoiceStats {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    draftAmount: number;
}