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
    meta?: Record<string, any> | null;
    identifiers?: Record<string, any> | null;
    services?: {
        active_service_ids?: string[];
        available_services?: Array<{
            id: string;
            name: string;
            count: number;
        }>;
    } | null;
    quote_inputs?: Record<string, any> | null;
    totals?: {
        subtotal: number;
        tax_rate: number;
        tax_amount: number;
        discount_amount: number;
        final_amount: number;
    } | null;
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
    client_address?: string;

    itinerary_id?: string;


    tax_rate?: number;
    discount_percent?: number;
    discount_amount?: number;


    services_included?: string[];
    active_service?: string;

    selected_preferences?: ISelectedPreferences;

    notes?: string;
    terms_conditions?: string;
    gst_number?: string;

    service_counts?: Record<string, number>;

    metadata?: Record<string, any>;

    meta?: Record<string, any>;
    identifiers?: Record<string, any>;
    client_information?: {
        name: string;
        email: string;
        phone: string;
        address?: string;
        gst_number?: string;
    };
    quote_information?: {
        quote_number: string;
        quote_title: string;
        currency: string;
        validity_days: number;
        valid_until: string;
        notes?: string;
        terms_conditions?: string;
        discount_percent?: number;
        discount_amount?: number;
    };
    itinerary_details?: Record<string, any>;
    services?: {
        active_service_ids: string[];
        available_services: Array<{
            id: string;
            name: string;
            count: number;
        }>;
    };
    quote_inputs?: {
        travel?: any;
        hotel?: any;
        visa?: any;
    };
    totals?: {
        subtotal: number;
        tax_rate: number;
        tax_amount: number;
        discount_amount: number;
        final_amount: number;
    };

    quote_number: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    quote_title: string;
    valid_until: string;
    currency: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    final_amount: number;
    initial_amount: number;
    line_items: IQuoteLineItem[];
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
    validity_days?: number;
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