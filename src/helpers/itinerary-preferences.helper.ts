import { IFrontendFormData, ICombinedPreferenceData } from '../interfaces/itinerary-preferences.interface';

/**
 * Validate frontend form data
 */
export function validateFormData(formData: IFrontendFormData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];


    if (!formData?.itineraryData?.id) {
        errors.push('Itinerary ID is required');
    }

    if (!formData.itineraryData?.client_name) {
        warnings.push('Client name is missing');
    }


    if (formData.flightOptions && formData.flightOptions.length > 0) {
        formData.flightOptions.forEach((flight, index) => {
            if (flight.airline && !flight.route) {
                warnings.push(`Flight option ${index + 1}: Route is recommended when airline is specified`);
            }
            if (flight.route && !flight.airline) {
                warnings.push(`Flight option ${index + 1}: Airline is recommended when route is specified`);
            }
            if (flight.estimatedPricePerPerson && parseFloat(flight.estimatedPricePerPerson) <= 0) {
                warnings.push(`Flight option ${index + 1}: Price should be greater than 0`);
            }
        });
    }


    if (formData.hotelOptions && formData.hotelOptions.length > 0) {
        formData.hotelOptions.forEach((hotel, index) => {
            if (hotel.hotelCategory && !hotel.mealPlan) {
                warnings.push(`Hotel option ${index + 1}: Meal plan is recommended when hotel category is specified`);
            }
            if (hotel.estimatedPricePerNight && parseFloat(hotel.estimatedPricePerNight) <= 0) {
                warnings.push(`Hotel option ${index + 1}: Price per night should be greater than 0`);
            }
        });
    }


    if (formData.visaOptions && formData.visaOptions.length > 0) {
        formData.visaOptions.forEach((visa, index) => {
            if (visa.visaType && !visa.processingTime) {
                warnings.push(`Visa option ${index + 1}: Processing time is recommended when visa type is specified`);
            }
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Calculate statistics from form data
 */
export function calculateFormStats(formData: IFrontendFormData): {
    total_flight_options: number;
    total_hotel_options: number;
    total_visa_options: number;
    filled_flight_options: number;
    filled_hotel_options: number;
    filled_visa_options: number;
    total_fields_filled: number;
} {
    const stats = {
        total_flight_options: formData.flightOptions?.length || 0,
        total_hotel_options: formData.hotelOptions?.length || 0,
        total_visa_options: formData.visaOptions?.length || 0,
        filled_flight_options: 0,
        filled_hotel_options: 0,
        filled_visa_options: 0,
        total_fields_filled: 0
    };


    if (formData.flightOptions) {
        stats.filled_flight_options = formData.flightOptions.filter(flight =>
            flight.airline || flight.route || flight.stops || flight.cabinClass
        ).length;
    }


    if (formData.hotelOptions) {
        stats.filled_hotel_options = formData.hotelOptions.filter(hotel =>
            hotel.hotelCategory || hotel.mealPlan || hotel.location
        ).length;
    }


    if (formData.visaOptions) {
        stats.filled_visa_options = formData.visaOptions.filter(visa =>
            visa.visaType || visa.processingTime || visa.documentChecklist
        ).length;
    }

    stats.total_fields_filled =
        (formData.flightOptions?.reduce((sum, flight) => {
            return sum + Object.values(flight).filter(val =>
                val !== '' && val !== null && val !== undefined && val !== false
            ).length;
        }, 0) || 0) +
        (formData.hotelOptions?.reduce((sum, hotel) => {
            return sum + Object.values(hotel).filter(val =>
                val !== '' && val !== null && val !== undefined && val !== false
            ).length;
        }, 0) || 0) +
        (formData.visaOptions?.reduce((sum, visa) => {
            return sum + Object.values(visa).filter(val =>
                val !== '' && val !== null && val !== undefined && val !== false
            ).length;
        }, 0) || 0);

    return stats;
}

/**
 * Generate a summary of preferences
 */
export function generatePreferencesSummary(preferences: ICombinedPreferenceData): {
    summary: string;
    details: {
        flights: string[];
        hotels: string[];
        visas: string[];
    };
} {
    const summaryLines: string[] = [];
    const details = {
        flights: [] as string[],
        hotels: [] as string[],
        visas: [] as string[]
    };


    if (preferences.flightPreferences.length > 0) {
        const flightCount = preferences.flightPreferences.length;
        summaryLines.push(`✈️ ${flightCount} flight option${flightCount > 1 ? 's' : ''}`);

        preferences.flightPreferences.forEach((flight, index) => {
            if (flight.airline || flight.route) {
                details.flights.push(`Option ${index + 1}: ${flight.airline || 'Unknown'} - ${flight.route || 'Unknown route'}`);
            }
        });
    }


    if (preferences.hotelPreferences.length > 0) {
        const hotelCount = preferences.hotelPreferences.length;
        summaryLines.push(`🏨 ${hotelCount} hotel option${hotelCount > 1 ? 's' : ''}`);

        preferences.hotelPreferences.forEach((hotel, index) => {
            if (hotel.hotel_category) {
                details.hotels.push(`Option ${index + 1}: ${hotel.hotel_category} - ${hotel.meal_plan || 'No meal plan'}`);
            }
        });
    }


    if (preferences.visaPreferences.length > 0) {
        const visaCount = preferences.visaPreferences.length;
        summaryLines.push(`🛂 ${visaCount} visa option${visaCount > 1 ? 's' : ''}`);

        preferences.visaPreferences.forEach((visa, index) => {
            if (visa.visa_type) {
                details.visas.push(`Option ${index + 1}: ${visa.visa_type} - ${visa.processing_time || 'Unknown processing time'}`);
            }
        });
    }


    if (preferences.userPreferences) {
        const status = [];
        if (preferences.userPreferences.flightPreferencesAdded) status.push('Flights ✓');
        if (preferences.userPreferences.hotelPreferencesAdded) status.push('Hotels ✓');
        if (preferences.userPreferences.visaPreferencesAdded) status.push('Visas ✓');

        if (status.length > 0) {
            summaryLines.push(`📊 Status: ${status.join(', ')}`);
        }
    }

    return {
        summary: summaryLines.join(' | '),
        details
    };
}

/**
 * Clean and format form data for display
 */
export function formatFormDataForDisplay(formData: IFrontendFormData): any {
    const formatted = {
        itinerary: {
            id: formData.itineraryData?.id,
            client_name: formData.itineraryData?.client_name,
            from_location: formData.itineraryData?.from_location,
            to_location: formData.itineraryData?.to_location,
            travel_date: formData.itineraryData?.travel_date
        },
        flight_options: formData.flightOptions?.map((flight, index) => ({
            id: `flight-${index + 1}`,
            airline: flight.airline || 'Not specified',
            route: flight.route || 'Not specified',
            stops: flight.stops || 'Not specified',
            cabin_class: flight.cabinClass || 'Not specified',
            price: flight.estimatedPricePerPerson ? `$${flight.estimatedPricePerPerson}` : 'Not specified'
        })),
        hotel_options: formData.hotelOptions?.map((hotel, index) => ({
            id: `hotel-${index + 1}`,
            category: hotel.hotelCategory || 'Not specified',
            meal_plan: hotel.mealPlan || 'Not specified',
            price_per_night: hotel.estimatedPricePerNight ? `$${hotel.estimatedPricePerNight}` : 'Not specified',
            total_cost: hotel.estimatedTotalStayCost ? `$${hotel.estimatedTotalStayCost}` : 'Not specified'
        })),
        visa_options: formData.visaOptions?.map((visa, index) => ({
            id: `visa-${index + 1}`,
            type: visa.visaType || 'Not specified',
            processing_time: visa.processingTime || 'Not specified',
            cost: visa.estimatedTotalCost ? `$${visa.estimatedTotalCost}` : 'Not specified'
        })),
        user_preferences: formData.userPreferences,
        metadata: formData.metadata
    };

    return formatted;
}