import { IFrontendFormData } from "../interfaces";

export function normalizeFrontendPayload(payload: any): IFrontendFormData {
    const isNested = !!payload.itineraryData;
    const metadata = payload.metadata || {};

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

        transferOptions: payload.transfer_preferences || [],
        groupBookingOptions: payload.group_booking_preferences || [],
        tourPackageOptions: payload.tour_package_preferences || [],
        aircraftCharterOptions: payload.aircraft_charter_preferences || [],
        eventManagementOptions: payload.event_management_preferences || [],
        yachtCharterOptions: payload.yacht_charter_preferences || [],

        userPreferences: {
            flightPreferencesAdded: metadata.flight_preferences_added ?? false,
            hotelPreferencesAdded: metadata.hotel_preferences_added ?? false,
            visaPreferencesAdded: metadata.visa_preferences_added ?? false,

            transferPreferencesAdded: metadata.transfer_preferences_added ?? false,
            groupBookingPreferencesAdded: metadata.group_booking_preferences_added ?? false,
            tourPackagePreferencesAdded: metadata.tour_package_preferences_added ?? false,
            aircraftCharterPreferencesAdded: metadata.aircraft_charter_preferences_added ?? false,
            eventManagementPreferencesAdded: metadata.event_management_preferences_added ?? false,
            yachtCharterPreferencesAdded: metadata.yacht_charter_preferences_added ?? false,

            lastUpdated: metadata.last_updated || new Date().toISOString(),
            metadata: metadata
        },

        metadata
    };
}
