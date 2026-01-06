export interface QuoteLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
}

export interface Quote {
    id: string;
    quoteNumber: string;
    leadId?: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    clientAddress?: string;
    destination?: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    currency: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
    createdAt: string;
    validUntil: string;
    template?: string;
    lineItems: QuoteLineItem[];
    notes?: string;
    termsConditions?: string;
    gstNumber?: string;
    initialAmount: number;
    discountPercent: number;
    discountAmount: number;
    finalAmount: number;
}

export interface CreateQuoteDTO {
    quoteNumber: string;
    leadId?: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    clientAddress?: string;
    destination?: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    currency: string;
    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
    validUntil: string;
    template?: string;
    lineItems: QuoteLineItem[];
    notes?: string;
    termsConditions?: string;
    gstNumber?: string;
    initialAmount: number;
    discountPercent: number;
    discountAmount: number;
    finalAmount: number;
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