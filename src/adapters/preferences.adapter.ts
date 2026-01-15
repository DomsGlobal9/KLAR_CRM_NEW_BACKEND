import { IFrontendFormData } from "../interfaces";

export function normalizeFrontendPayload(payload: any): IFrontendFormData {
    const isNested = !!payload.itineraryData;

    return {
        itineraryData: isNested
            ? payload.itineraryData
            : {
                id: payload.itinerary_id,
                itinerary_number: payload.itinerary_number,
                client_name: payload.client_name,
                
            },
        flightOptions: payload.flight_preferences || payload.flightOptions || [],
        hotelOptions: payload.hotel_preferences || payload.hotelOptions || [],
        visaOptions: payload.visa_preferences || payload.visaOptions || [],
        userPreferences: {
            flightPreferencesAdded: payload.metadata?.flight_preferences_added ?? false,
            hotelPreferencesAdded: payload.metadata?.hotel_preferences_added ?? false,
            visaPreferencesAdded: payload.metadata?.visa_preferences_added ?? false,
            lastUpdated: payload.metadata?.last_updated || new Date().toISOString(),
        },
        metadata: payload.metadata || {}
    };
}