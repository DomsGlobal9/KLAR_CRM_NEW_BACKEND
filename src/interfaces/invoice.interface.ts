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
    invoice_number: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_address?: string;
    subtotal: number;
    discount?: number;
    tax_amount: number;
    total: number;
    currency: string;
    status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
    created_at: string;
    due_date: string;
    quote_reference?: string;
    paid_amount: number;
    paid_date?: string;
    sent_at?: string;
    line_items: LineItem[];
    notes?: string;
    terms_conditions?: string;
    gst_number?: string;
}

export interface CreateInvoiceDTO {
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_address?: string;
    subtotal: number;
    discount?: number;
    tax_amount: number;
    total: number;
    currency: string;
    status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
    due_date?: string;
    quote_reference?: string;
    line_items: LineItem[];
    notes?: string;
    terms_conditions?: string;
    gst_number?: string;
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