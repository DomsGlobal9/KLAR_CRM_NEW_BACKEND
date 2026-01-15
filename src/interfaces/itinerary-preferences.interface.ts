export interface IFlightPreference {
    id: string;
    itinerary_id: string;
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
    itinerary_id: string;
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
    itinerary_id: string;
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
    itinerary_id: string;
    flight_preferences_added: boolean;
    hotel_preferences_added: boolean;
    visa_preferences_added: boolean;
    last_updated: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface ICombinedPreferenceData {
    itineraryId: string;
    flightPreferences: Omit<IFlightPreference, 'id' | 'itinerary_id' | 'created_at' | 'updated_at'>[];
    hotelPreferences: Omit<IHotelPreference, 'id' | 'itinerary_id' | 'created_at' | 'updated_at'>[];
    visaPreferences: Omit<IVisaPreference, 'id' | 'itinerary_id' | 'created_at' | 'updated_at'>[];
    userPreferences: {
        flightPreferencesAdded: boolean;
        hotelPreferencesAdded: boolean;
        visaPreferencesAdded: boolean;
        lastUpdated: string;
        metadata?: Record<string, any>;
    };
}

export interface IItineraryPreferencesResponse {
    itinerary_id: string;
    flight_preferences: IFlightPreference[];
    hotel_preferences: IHotelPreference[];
    visa_preferences: IVisaPreference[];
    user_preferences_summary: IUserPreferencesSummary | null;
}

export interface IUpdatePreferenceData {
    flightPreferences?: Omit<IFlightPreference, 'id' | 'itinerary_id' | 'created_at' | 'updated_at'>[];
    hotelPreferences?: Omit<IHotelPreference, 'id' | 'itinerary_id' | 'created_at' | 'updated_at'>[];
    visaPreferences?: Omit<IVisaPreference, 'id' | 'itinerary_id' | 'created_at' | 'updated_at'>[];
    userPreferences?: {
        flightPreferencesAdded?: boolean;
        hotelPreferencesAdded?: boolean;
        visaPreferencesAdded?: boolean;
        lastUpdated?: string;
        metadata?: Record<string, any>;
    };
}

export interface IFrontendFormData {
    itineraryData: any;
    flightOptions: any[];
    hotelOptions: any[];
    visaOptions: any[];
    userPreferences: {
        flightPreferencesAdded: boolean;
        hotelPreferencesAdded: boolean;
        visaPreferencesAdded: boolean;
        lastUpdated: string;
    };
    metadata?: any;
}