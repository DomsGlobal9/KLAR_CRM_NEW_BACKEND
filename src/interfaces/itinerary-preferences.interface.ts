export interface IFlightPreference {
    id: string;
    lead_id: string;
    preference_order: number;
    airline?: string;
    route?: string;
    stops?: string;
    cabin_class?: string;
    estimated_price_per_person?: number;
    departure_arrival_time?: string;
    fare_type?: string;
    preferred_time_slot?: string;
    better_connection_duration?: string;
    flexible_schedule?: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface IHotelPreference {
    id: string;
    lead_id: string;
    preference_order: number;
    hotel_category?: string;
    meal_plan?: string;
    estimated_price_per_night?: number;
    estimated_total_stay_cost?: number;
    stay_type?: string;
    location?: string;
    room_type?: string;
    better_location?: string;
    premium_amenities?: string;
    experience_highlights?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface IVisaPreference {
    id: string;
    lead_id: string;
    preference_order: number;
    visa_type?: string;
    processing_time?: string;
    estimated_total_cost?: number;
    document_checklist?: string;
    special_requirements?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface IUserPreferencesSummary {
    id: string;
    lead_id: string;
    flight_preferences_added: boolean;
    hotel_preferences_added: boolean;
    visa_preferences_added: boolean;
    last_updated: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface ICombinedPreferenceData {
    leadId: string;
    flightPreferences: Omit<IFlightPreference, 'id' | 'lead_id' | 'created_at' | 'updated_at'>[];
    hotelPreferences: Omit<IHotelPreference, 'id' | 'lead_id' | 'created_at' | 'updated_at'>[];
    visaPreferences: Omit<IVisaPreference, 'id' | 'lead_id' | 'created_at' | 'updated_at'>[];
    userPreferences: {
        flightPreferencesAdded: boolean;
        hotelPreferencesAdded: boolean;
        visaPreferencesAdded: boolean;
        transferPreferencesAdded: boolean;
        groupBookingPreferencesAdded: boolean;
        tourPackagePreferencesAdded: boolean;
        aircraftCharterPreferencesAdded: boolean;
        eventManagementPreferencesAdded: boolean;
        yachtCharterPreferencesAdded: boolean;
        lastUpdated: string;
        metadata?: Record<string, any>;
    };
    leadDetails?: ILeadDetails;
}

export interface IItineraryPreferencesResponse {
    lead_id?: string;
    flight_preferences: IFlightPreference[];
    hotel_preferences: IHotelPreference[];
    visa_preferences: IVisaPreference[];
    user_preferences_summary?: IUserPreferencesSummary | null;
    service_preferences?: IServicePreference[];
    lead_details?: ILeadDetails;
}

export interface IUpdatePreferenceData {
    flightPreferences?: Omit<IFlightPreference, 'id' | 'lead_id' | 'created_at' | 'updated_at'>[];
    hotelPreferences?: Omit<IHotelPreference, 'id' | 'lead_id' | 'created_at' | 'updated_at'>[];
    visaPreferences?: Omit<IVisaPreference, 'id' | 'lead_id' | 'created_at' | 'updated_at'>[];
    userPreferences?: {
        flightPreferencesAdded: boolean;
        hotelPreferencesAdded: boolean;
        visaPreferencesAdded: boolean;
        transferPreferencesAdded: boolean;
        groupBookingPreferencesAdded: boolean;
        tourPackagePreferencesAdded: boolean;
        aircraftCharterPreferencesAdded: boolean;
        eventManagementPreferencesAdded: boolean;
        yachtCharterPreferencesAdded: boolean;
        lastUpdated: string;
        metadata?: Record<string, any>;
    };
}

export interface IFrontendFormData {
    leadData?: any;
    itineraryData: any;
    flightOptions: any[];
    hotelOptions: any[];
    visaOptions: any[];
    userPreferences: {
        flightPreferencesAdded: boolean;
        hotelPreferencesAdded: boolean;
        visaPreferencesAdded: boolean;
        transferPreferencesAdded: boolean;
        groupBookingPreferencesAdded: boolean;
        tourPackagePreferencesAdded: boolean;
        aircraftCharterPreferencesAdded: boolean;
        eventManagementPreferencesAdded: boolean;
        yachtCharterPreferencesAdded: boolean;
        lastUpdated: string;
        metadata?: Record<string, any>;
    };
    metadata?: any;
}

export interface ILeadDetails {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: string;
    status: string;
    stage: string;
    captured_from: string;
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

export interface IAllRelatedDetailsResponse {
    success: boolean;
    type?: 'flight' | 'hotel' | 'visa' | 'summary' | 'lead';
    data?: {
        preference?: IFlightPreference
        | IHotelPreference
        | IVisaPreference
        | IUserPreferencesSummary;
        lead?: {
            id: string;
            flight_preferences?: IFlightPreference[];
            hotel_preferences?: IHotelPreference[];
            visa_preferences?: IVisaPreference[];
            user_preferences_summary?: IUserPreferencesSummary | null;
            lead_details?: ILeadDetails;
        };
        summary: {
            preference_type: string;
            lead_id?: string;
            has_lead_data: boolean;
            has_related_preferences: boolean;
            total_related_preferences: number;
        };
    };
    message?: string;
}

export interface IAllItinerariesResponse {
    success: boolean;
    data: {
        leads: IItineraryPreferencesResponse[];
        total_count: number;
        pagination?: {
            page: number;
            limit: number;
            total_pages: number;
        };
    };
    summary?: {
        total_leads: number;
        total_flight_preferences: number;
        total_hotel_preferences: number;
        total_visa_preferences: number;
        leads_with_flight_prefs: number;
        leads_with_hotel_prefs: number;
        leads_with_visa_prefs: number;
        complete_leads: number;
    };
    message?: string;
}

export interface IPaginationParams {
    page?: number;
    limit?: number;
    sort_by?: 'created_at' | 'updated_at' | 'last_updated';
    sort_order?: 'asc' | 'desc';
}

export interface IDateRangeParams {
    start_date: string;
    end_date: string;
    field?: 'created_at' | 'updated_at' | 'last_updated';
}

export interface ILeadSummary {
    lead_id: string;
    flight_preferences_count: number;
    hotel_preferences_count: number;
    visa_preferences_count: number;
    has_all_preferences: boolean;
    last_updated: string;
    created_at: string;
    user_summary?: {
        flight_preferences_added: boolean;
        hotel_preferences_added: boolean;
        visa_preferences_added: boolean;
    };
}

interface IBasicLeadInfo {
    lead_id: string;
    lead_details?: {
        name?: string;
        email?: string;
        phone?: string;
        status?: string;
    };
    flight_preferences_count?: number;
    hotel_preferences_count?: number;
    visa_preferences_count?: number;
    user_preferences_summary?: {
        id: string;
        lead_id: string;
        created_at?: string;
        updated_at?: string;
    };
}

export interface IAllLeadsBasicResponse {
    success: boolean;
    data: {
        leads: IBasicLeadInfo[];
        total_count: number;
        pagination?: {
            page: number;
            limit: number;
            total_pages: number;
        };
    };
    summary?: {
        total_leads: number;
        total_flight_preferences: number;
        total_hotel_preferences: number;
        total_visa_preferences: number;
        leads_with_flight_prefs: number;
        leads_with_hotel_prefs: number;
        leads_with_visa_prefs: number;
        complete_leads: number;
    };
    message?: string;
}

export interface IServicePreference {
    id: string;
    lead_id: string;
    service_type: string;
    service_code: string;
    preference_order: number;
    title?: string;
    description?: string;
    estimated_price?: number;
    currency?: string;
    preferences: Record<string, any>;
    is_active: boolean;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface IFrontendFormData {
    leadData?: any;
    itineraryData: any;
    flightOptions: any[];
    hotelOptions: any[];
    visaOptions: any[];
    transferOptions: any[];
    groupBookingOptions: any[];
    tourPackageOptions: any[];
    aircraftCharterOptions: any[];
    eventManagementOptions: any[];
    yachtCharterOptions: any[];
    userPreferences: {
        flightPreferencesAdded: boolean;
        hotelPreferencesAdded: boolean;
        visaPreferencesAdded: boolean;
        transferPreferencesAdded: boolean;
        groupBookingPreferencesAdded: boolean;
        tourPackagePreferencesAdded: boolean;
        aircraftCharterPreferencesAdded: boolean;
        eventManagementPreferencesAdded: boolean;
        yachtCharterPreferencesAdded: boolean;
        lastUpdated: string;
        metadata?: Record<string, any>;
    };
    metadata?: any;
}

