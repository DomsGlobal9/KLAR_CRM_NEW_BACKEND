export interface ILineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
}

export interface IInvoice {
    id: string;
    invoice_number: string;
    quote_number?: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_address?: string;
    billing_address?: string;
    subtotal: number;
    discount: number;
    tax_amount: number;
    total: number;
    currency: string;
    status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
    created_at: string;
    due_date: string;
    due_date_time?: string;
    quote_reference?: string;
    paid_amount: number;
    paid_date?: string;
    sent_at?: string;
    payment_method?: string;
    include_quote_details: boolean;
    line_items: ILineItem[];
    notes?: string;
    terms_conditions?: string;
    gst_number?: string;
}

export interface ICreateInvoiceDTO {
    invoice_number?: string;
    quote_number?: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_address?: string;
    billing_address?: string;
    subtotal?: number;
    discount?: number;
    tax_amount?: number;
    total: number;
    currency: string;
    status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
    due_date?: string;
    due_date_time?: string;
    quote_reference?: string;
    payment_method?: string;
 
    paid_amount?: number;
    include_quote_details?: boolean;
    line_items: ILineItem[];
    notes?: string;
    terms_conditions?: string;
    gst_number?: string;
}

export interface IUpdateInvoiceDTO {
    status?: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
    paid_amount?: number;
    paid_date?: string;
    sent_at?: string;
    notes?: string;
}

export interface IInvoiceStats {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    draftAmount: number;
}

export interface IConvertQuoteToInvoiceDTO {
    quote_number: string;
    invoice_date: string;
    payment_method: string;
    payment_deadline: string;
    payment_deadline_time?: string;
    include_quote_details: boolean;
    send_invoice: boolean;
    quote_total: number;
    quote_currency: string;
    client: string;
    client_name: string;
    client_email: string;
    billing_address?: string;
    notes?: string;
    terms_conditions?: string;
    quote_reference?: string;
    paid_amount?: number;
    gst_number?: string;
}