export interface IQuote {
    id: string;
    quote_number: string;
    lead_id?: string | null;
    client_name: string;
    client_email: string;
    client_phone?: string | null;
    client_address?: string | null;
    destination?: string | null;
    subtotal: number;
    tax_amount: number;
    total: number;
    currency: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
    created_at: Date | string;
    valid_until: Date | string;
    template?: string | null;
    line_items: IQuoteLineItem[];
    notes?: string | null;
    terms_conditions?: string | null;
    gst_number?: string | null;
    initial_amount: number;
    discount_percent?: number | null;
    discount_amount?: number | null;
    final_amount: number;
    itinerary_id?: string | null;
    quote_title?: string | null;
    validity_days?: number | null;
    services_included?: string[] | null;
    active_service?: string | null;
    itinerary_details?: Record<string, any> | null;
    service_counts?: Record<string, number> | null;
    user_preference_id?: string | null;
    tax_rate?: number | null;
    selected_preferences?: ISelectedPreferences | null;
    metadata?: Record<string, any>;
}

export interface IQuoteLineItem {
    service_type: 'flight' | 'hotel' | 'visa' | 'other';
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    details: {
        [key: string]: any;
        preference_details?: any | null;
    };
}

export interface ISelectedPreferences {
    travel?: any | null;
    hotel?: any | null;
    visa?: any | null;
}

export interface ICreateQuoteDTO {
    quote_number: string;
    quote_title: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
    valid_until: Date | string;
    validity_days?: number;
    currency: string;

    client_name: string;
    client_email: string;
    client_phone?: string;
    client_address?: string;

    itinerary_id?: string;

    subtotal: number;
    tax_amount: number;
    tax_rate?: number;
    discount_percent?: number;
    discount_amount?: number;
    total: number;
    final_amount: number;
    initial_amount: number;

    services_included?: string[];
    active_service?: string;

    line_items: IQuoteLineItem[];
    selected_preferences?: ISelectedPreferences;

    notes?: string;
    terms_conditions?: string;
    gst_number?: string;

    itinerary_details?: Record<string, any>;
    service_counts?: Record<string, number>;

    metadata?: Record<string, any>;
}

export interface IUpdateQuoteDTO {
    quote_title?: string;
    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
    valid_until?: Date | string;
    validity_days?: number;

    client_name?: string;
    client_email?: string;
    client_phone?: string;
    client_address?: string;

    subtotal?: number;
    tax_amount?: number;
    tax_rate?: number;
    discount_percent?: number;
    discount_amount?: number;
    total?: number;
    final_amount?: number;

    services_included?: string[];
    active_service?: string;

    line_items?: IQuoteLineItem[];
    selected_preferences?: ISelectedPreferences;

    notes?: string;
    terms_conditions?: string;
    gst_number?: string;

    itinerary_details?: Record<string, any>;
    service_counts?: Record<string, number>;

    metadata?: Record<string, any>;
}

export interface IQuoteFilter {
    search?: string;
    status?: string;
    client_email?: string;
    itinerary_id?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface IQuoteStats {
    total: number;
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    cancelled: number;
    total_amount: number;
    average_amount: number;
}

export interface IQuoteWithRelations extends IQuote {
    // You can add relations here if needed in future
}

export interface IQuoteResponse {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
}