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
    destination?: string; // Frontend uses 'destination', not 'to_location'
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

    // Service relationships from frontend
    service_selections?: Array<{
        service_id: string;
        service_name: string;
        service_type?: string;
        categories: Array<{
            category_id: string;
            category_name: string;
            sub_service_ids: string[];
            sub_service_single?: string;
        }>;
        service_specific: Record<string, any>;
    }>;

    // NEW: Additional frontend fields
    inquiry_source?: string;
    preferred_contact_method?: string;
    budget_range?: string;
    timeline?: string;
    country_city?: string;
    team_id?: string;
    team_name?: string;
    assigned_member_name?: string;

    // Status & stage from frontend
    status?: 'active' | 'inactive' | 'converted';
    stage?: string;
}

export interface UpdateLeadPayload {
    // Primary Details
    name?: string;
    email?: string;
    phone?: string;
    type?: 'event' | 'travel' | 'visa' | 'other';
    status?: 'active' | 'inactive' | 'converted';
    stageId?: string;
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

    service_selections?: Array<{
        service_id: string;
        service_name: string;
        service_type?: string;
        categories: Array<{
            category_id: string;
            category_name: string;
            sub_service_ids: string[];
            sub_service_single?: string;
        }>;
        service_specific: Record<string, any>;
    }>;

    // NEW: Additional frontend fields
    inquiry_source?: string;
    preferred_contact_method?: string;
    budget_range?: string;
    timeline?: string;
    country_city?: string;
    team_id?: string;
    team_name?: string;
    assigned_member_name?: string;
}

export interface LeadFilter {
    search?: string;
    stage?: string;
    stage_id?: string;
    status?: string;
    customer_category?: string;
    assigned_to?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
    currentUser?: {
        id: string;
        role: string;
    };
}

export interface LeadStats {
    total: number;
    by_stage: Record<string, number>;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
    recent_count: number;
    converted_count: number;
}

export interface LeadWithRequirements extends Lead {
    requirements?: LeadRequirements;
    service_relationships?: LeadServiceRelationship[];
    assigned_user?: {
        id: string;
        email: string;
        username: string | null;
        full_name: string | null;
        role_name: string | null;
        team_id: string | null;
    };
}

export interface LeadServiceRelationship {
    id: string;
    lead_id: string;
    service_id: string;
    service_name: string;
    service_type?: string;
    sub_service_category_id: string;
    sub_service_category_name: string;
    sub_service_id: string;
    sub_service_name: string;
    selection_type: 'single' | 'multi';
    service_specific: Record<string, any>;
    attachments: Array<{
        name: string;
        size: number;
        type: string;
        status: 'uploading' | 'uploaded' | 'error';
        url?: string;
        preview_url?: string;
        upload_date: string;
        error?: string;
    }>;
    created_at: string;
    updated_at: string;
}

