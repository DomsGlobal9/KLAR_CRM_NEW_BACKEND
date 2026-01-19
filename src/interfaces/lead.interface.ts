// ============================================
// EXISTING INTERFACES (Keep as is)
// ============================================
export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: 'event' | 'travel' | 'visa' | 'other';
    status: 'active' | 'inactive' | 'converted';
    stage: string;
    captured_from: 'web_form' | 'api' | 'manual';
    assigned_to?: string;
    created_by?: string;
    source?: string;
    source_medium?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    created_at: string;
    updated_at: string;
}

export interface LeadRequirements {
    id: string;
    lead_id: string;
    from_location?: string;
    to_location?: string;
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
    created_at: string;
    updated_at: string;
}

// ============================================
// NEW INTERFACES FOR ENHANCED FUNCTIONALITY
// ============================================

export interface LeadFlightRequirement {
    id: string;
    lead_id: string;
    departure_city: string;
    arrival_city: string;
    departure_date: string;
    return_date?: string;
    number_of_passengers: number;
    class?: 'economy' | 'premium_economy' | 'business' | 'first';
    preferred_airline?: string;
    preferred_departure_time?: string;
    flexible_dates?: boolean;
    budget_per_person?: number;
    total_budget?: number;
    special_requests?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LeadHotelRequirement {
    id: string;
    lead_id: string;
    city: string;
    check_in_date: string;
    check_out_date: string;
    number_of_nights?: number;
    number_of_rooms: number;
    room_type?: 'standard' | 'deluxe' | 'suite' | 'executive' | 'presidential';
    number_of_guests: number;
    star_rating?: number;
    preferred_hotel_chain?: string;
    preferred_location?: string;
    amenities?: string[];
    budget_per_night?: number;
    total_budget?: number;
    special_requests?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LeadJourneyDetails {
    id: string;
    lead_id: string;
    journey_type: 'one_way' | 'round_trip' | 'multi_city';
    total_travelers: number;
    start_date: string;
    end_date?: string;
    total_days?: number;
    total_budget?: number;
    budget_breakdown?: Record<string, any>;
    travel_purpose?: string;
    trip_category?: string;
    needs_visa: boolean;
    needs_insurance: boolean;
    needs_transport: boolean;
    assigned_rm_id?: string;
    assigned_rm_name?: string;
    journey_status: 'planning' | 'quoted' | 'booked' | 'completed' | 'cancelled';
    client_notes?: string;
    rm_notes?: string;
    metadata?: Record<string, any>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================
// EXTENDED LEAD WITH ALL REQUIREMENTS
// ============================================
export interface LeadWithFullRequirements extends Lead {
    requirements?: LeadRequirements;
    flight_requirements?: LeadFlightRequirement[];
    hotel_requirements?: LeadHotelRequirement[];
    journey_details?: LeadJourneyDetails;
}

export interface LeadWithRequirements extends Lead {
    requirements?: LeadRequirements;
}

// ============================================
// CREATE/UPDATE PAYLOADS
// ============================================
export interface CreateFlightRequirementPayload {
    departure_city: string;
    arrival_city: string;
    departure_date: string;
    return_date?: string;
    number_of_passengers?: number;
    class?: 'economy' | 'premium_economy' | 'business' | 'first';
    preferred_airline?: string;
    preferred_departure_time?: string;
    flexible_dates?: boolean;
    budget_per_person?: number;
    total_budget?: number;
    special_requests?: string;
}

export interface CreateHotelRequirementPayload {
    city: string;
    check_in_date: string;
    check_out_date: string;
    number_of_rooms?: number;
    room_type?: 'standard' | 'deluxe' | 'suite' | 'executive' | 'presidential';
    number_of_guests?: number;
    star_rating?: number;
    preferred_hotel_chain?: string;
    preferred_location?: string;
    amenities?: string[];
    budget_per_night?: number;
    total_budget?: number;
    special_requests?: string;
}

export interface CreateJourneyDetailsPayload {
    journey_type?: 'one_way' | 'round_trip' | 'multi_city';
    total_travelers?: number;
    start_date: string;
    end_date?: string;
    total_days?: number;
    total_budget?: number;
    budget_breakdown?: Record<string, any>;
    travel_purpose?: string;
    trip_category?: string;
    needs_visa?: boolean;
    needs_insurance?: boolean;
    needs_transport?: boolean;
    assigned_rm_id?: string;
    assigned_rm_name?: string;
    journey_status?: 'planning' | 'quoted' | 'booked' | 'completed' | 'cancelled';
    client_notes?: string;
    rm_notes?: string;
    metadata?: Record<string, any>;
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

    // Basic Requirements (Backward Compatible)
    from_location?: string;
    to_location?: string;
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

    // NEW: Enhanced Requirements
    flight_requirements?: CreateFlightRequirementPayload[];
    hotel_requirements?: CreateHotelRequirementPayload[];
    journey_details?: CreateJourneyDetailsPayload;
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

    // Basic Requirements
    from_location?: string;
    to_location?: string;
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

// ============================================
// FILTERS & STATS
// ============================================
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