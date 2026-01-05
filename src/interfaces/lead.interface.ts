export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: 'event' | 'travel' | 'visa' | 'other';

    // Status & Tracking
    status: 'active' | 'inactive' | 'converted';
    stage: string;
    captured_from: 'web_form' | 'api' | 'manual';

    // Assignment & Ownership
    assigned_to?: string;
    created_by?: string;

    // Marketing Attribution
    source?: string;
    source_medium?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface LeadRequirements {
    id: string;
    lead_id: string;

    // Travel Details
    from_location?: string;
    destination?: string;
    travel_date?: string;
    return_date?: string;

    // Service Details
    service_type?: string;
    services?: string;
    sub_service?: string;
    needs_visa?: boolean;

    // Package Details
    budget?: number;
    travelers?: number;
    flight_class?: string;

    // Customer Classification
    customer_category?: 'individual' | 'corporate';
    sub_category?: string;

    // Corporate Details
    company_name?: string;
    company_address?: string;
    company_details?: string;
    gst_number?: string;

    // Lead Type
    lead_type?: string;

    // Notes
    notes?: string;

    // Timestamps
    created_at: string;
    updated_at: string;
}


export interface LeadWithRequirements extends Lead {
    requirements?: LeadRequirements;
}


export interface CreateLeadPayload {
    // Primary Details (Required)
    name: string;
    email: string;
    phone: string;
    type: 'event' | 'travel' | 'visa' | 'other';

    // Optional Primary Details
    source?: string;
    source_medium?: string;
    assigned_to?: string;
    captured_from?: 'web_form' | 'api' | 'manual';
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;

    // Requirements (All Optional)
    from_location?: string;
    destination?: string;
    travel_date?: string;
    return_date?: string;
    service_type?: string;
    services?: string;
    sub_service?: string;
    needs_visa?: boolean;
    budget?: number;
    travelers?: number;
    flight_class?: string;
    customer_category?: 'individual' | 'corporate';
    sub_category?: string;
    company_name?: string;
    company_address?: string;
    company_details?: string;
    gst_number?: string;
    lead_type?: string;
    notes?: string;
}

export interface UpdateLeadPayload {
    // Primary Details
    name?: string;
    email?: string;
    phone?: string;
    type?: 'event' | 'travel' | 'visa' | 'other';
    status?: 'active' | 'inactive' | 'converted';
    stage?: string;
    assigned_to?: string;
    source?: string;
    source_medium?: string;

    // Requirements
    from_location?: string;
    destination?: string;
    travel_date?: string;
    return_date?: string;
    service_type?: string;
    services?: string;
    sub_service?: string;
    needs_visa?: boolean;
    budget?: number;
    travelers?: number;
    flight_class?: string;
    customer_category?: 'individual' | 'corporate';
    sub_category?: string;
    company_name?: string;
    company_address?: string;
    company_details?: string;
    gst_number?: string;
    lead_type?: string;
    notes?: string;
}


export interface LeadFilter {
    search?: string;
    stage?: string;
    status?: string;
    customer_category?: string;
    assigned_to?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
}

export interface LeadStats {
    total: number;
    by_stage: Record<string, number>;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
    recent_count: number;
    converted_count: number;
}