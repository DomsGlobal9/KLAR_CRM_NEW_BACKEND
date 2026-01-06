export interface QuoteLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
}

// src/interfaces/quote.interface.ts
export interface Quote {
    id: string;
    quote_number: string;
    lead_id?: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_address?: string;
    destination?: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    currency: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
    created_at: string;
    valid_until: string;
    template?: string;
    line_items: QuoteLineItem[];
    notes?: string;
    terms_conditions?: string;
    gst_number?: string;
    initial_amount: number;
    discount_percent: number;
    discount_amount: number;
    final_amount: number;
}

export interface CreateQuoteDTO {
    quote_number: string;
    lead_id: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_address?: string;
    destination?: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    currency: string;
    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
    valid_until: string;
    template?: string;
    line_items: QuoteLineItem[];
    notes?: string;
    terms_conditions?: string;
    gst_number?: string;
    initial_amount: number;
    discount_percent: number;
    discount_amount: number;
    final_amount: number;
}

export interface UpdateQuoteDTO {
    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
    validUntil?: string;
    notes?: string;
    termsConditions?: string;
}

export interface QuoteStats {
    totalQuotes: number;
    acceptedQuotes: number;
    rejectedQuotes: number;
    convertedQuotes: number;
    totalAmount: number;
}