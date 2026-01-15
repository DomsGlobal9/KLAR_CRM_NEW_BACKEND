import { supabaseAdmin } from '../config';
import {
    IFlightPreference,
    IHotelPreference,
    IVisaPreference,
    IUserPreferencesSummary,
    IItineraryPreferencesResponse,
    ICombinedPreferenceData,
    IFrontendFormData
} from '../interfaces/itinerary-preferences.interface';

export const itineraryPreferencesRepository = {
    /**
     * Get all preferences for an itinerary
     */
    async getByItineraryId(itineraryId: string): Promise<IItineraryPreferencesResponse> {
        try {

            const [
                flightPreferencesResult,
                hotelPreferencesResult,
                visaPreferencesResult,
                userPreferencesResult
            ] = await Promise.all([
                supabaseAdmin
                    .from('flight_preferences')
                    .select('*')
                    .eq('itinerary_id', itineraryId)
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('hotel_preferences')
                    .select('*')
                    .eq('itinerary_id', itineraryId)
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('visa_preferences')
                    .select('*')
                    .eq('itinerary_id', itineraryId)
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .select('*')
                    .eq('itinerary_id', itineraryId)
                    .single()
            ]);


            if (flightPreferencesResult.error && flightPreferencesResult.error.code !== 'PGRST116') {
                throw new Error(`Failed to fetch flight preferences: ${flightPreferencesResult.error.message}`);
            }

            if (hotelPreferencesResult.error && hotelPreferencesResult.error.code !== 'PGRST116') {
                throw new Error(`Failed to fetch hotel preferences: ${hotelPreferencesResult.error.message}`);
            }

            if (visaPreferencesResult.error && visaPreferencesResult.error.code !== 'PGRST116') {
                throw new Error(`Failed to fetch visa preferences: ${visaPreferencesResult.error.message}`);
            }


            const userPrefsError = userPreferencesResult.error;
            if (userPrefsError && userPrefsError.code !== 'PGRST116') {
                console.warn('Error fetching user preferences summary:', userPrefsError.message);
            }

            console.log("@@@@@@@@@@@@\nThe repository data we get", { flightPreferencesResult, hotelPreferencesResult, visaPreferencesResult, userPreferencesResult });

            return {
                itinerary_id: itineraryId,
                flight_preferences: flightPreferencesResult.data as IFlightPreference[] || [],
                hotel_preferences: hotelPreferencesResult.data as IHotelPreference[] || [],
                visa_preferences: visaPreferencesResult.data as IVisaPreference[] || [],
                user_preferences_summary: userPreferencesResult.data as IUserPreferencesSummary || null
            };
        } catch (error) {
            console.error('Error in getByItineraryId:', error);
            throw new Error(`Failed to fetch itinerary preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },


    /**
     * Save all preferences for an itinerary
     */
    async saveAllPreferences(data: ICombinedPreferenceData): Promise<IItineraryPreferencesResponse> {
        const { itineraryId, flightPreferences, hotelPreferences, visaPreferences, userPreferences } = data;

        try {

            await this.deleteByItineraryId(itineraryId);


            let savedFlightPreferences: IFlightPreference[] = [];
            if (flightPreferences.length > 0) {
                const flightPrefsToInsert = flightPreferences.map((pref, index) => ({
                    ...pref,
                    itinerary_id: itineraryId,
                    preference_order: index + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const { data: flightData, error: flightError } = await supabaseAdmin
                    .from('flight_preferences')
                    .insert(flightPrefsToInsert)
                    .select();

                if (flightError) throw new Error(`Failed to save flight preferences: ${flightError.message}`);
                savedFlightPreferences = flightData as IFlightPreference[] || [];
            }


            let savedHotelPreferences: IHotelPreference[] = [];
            if (hotelPreferences.length > 0) {
                const hotelPrefsToInsert = hotelPreferences.map((pref, index) => ({
                    ...pref,
                    itinerary_id: itineraryId,
                    preference_order: index + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const { data: hotelData, error: hotelError } = await supabaseAdmin
                    .from('hotel_preferences')
                    .insert(hotelPrefsToInsert)
                    .select();

                if (hotelError) throw new Error(`Failed to save hotel preferences: ${hotelError.message}`);
                savedHotelPreferences = hotelData as IHotelPreference[] || [];
            }


            let savedVisaPreferences: IVisaPreference[] = [];
            if (visaPreferences.length > 0) {
                const visaPrefsToInsert = visaPreferences.map((pref, index) => ({
                    ...pref,
                    itinerary_id: itineraryId,
                    preference_order: index + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const { data: visaData, error: visaError } = await supabaseAdmin
                    .from('visa_preferences')
                    .insert(visaPrefsToInsert)
                    .select();

                if (visaError) throw new Error(`Failed to save visa preferences: ${visaError.message}`);
                savedVisaPreferences = visaData as IVisaPreference[] || [];
            }


            const userPrefsSummary: Omit<IUserPreferencesSummary, 'id'> = {
                itinerary_id: itineraryId,
                flight_preferences_added: userPreferences.flightPreferencesAdded,
                hotel_preferences_added: userPreferences.hotelPreferencesAdded,
                visa_preferences_added: userPreferences.visaPreferencesAdded,
                last_updated: userPreferences.lastUpdated || new Date().toISOString(),
                metadata: userPreferences.metadata || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: userPrefsData, error: userPrefsError } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .insert(userPrefsSummary)
                .select()
                .single();

            if (userPrefsError) throw new Error(`Failed to save user preferences summary: ${userPrefsError.message}`);

            return {
                itinerary_id: itineraryId,
                flight_preferences: savedFlightPreferences,
                hotel_preferences: savedHotelPreferences,
                visa_preferences: savedVisaPreferences,
                user_preferences_summary: userPrefsData as IUserPreferencesSummary
            };
        } catch (error) {
            console.error('Error in saveAllPreferences:', error);
            throw new Error(`Failed to save itinerary preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Update specific preferences for an itinerary
     */
    async updatePreferences(itineraryId: string, updateData: any): Promise<IItineraryPreferencesResponse> {
        try {

            if (updateData.userPreferences) {
                const userPrefsUpdate = {
                    flight_preferences_added: updateData.userPreferences.flightPreferencesAdded,
                    hotel_preferences_added: updateData.userPreferences.hotelPreferencesAdded,
                    visa_preferences_added: updateData.userPreferences.visaPreferencesAdded,
                    last_updated: updateData.userPreferences.lastUpdated || new Date().toISOString(),
                    metadata: updateData.userPreferences.metadata || {},
                    updated_at: new Date().toISOString()
                };

                const { error } = await supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .update(userPrefsUpdate)
                    .eq('itinerary_id', itineraryId);

                if (error) throw new Error(`Failed to update user preferences: ${error.message}`);
            }


            if (updateData.flightPreferences && Array.isArray(updateData.flightPreferences)) {
                await supabaseAdmin
                    .from('flight_preferences')
                    .delete()
                    .eq('itinerary_id', itineraryId);

                if (updateData.flightPreferences.length > 0) {
                    const flightPrefsToInsert = updateData.flightPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        itinerary_id: itineraryId,
                        preference_order: index + 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));

                    const { error } = await supabaseAdmin
                        .from('flight_preferences')
                        .insert(flightPrefsToInsert);

                    if (error) throw new Error(`Failed to update flight preferences: ${error.message}`);
                }
            }


            if (updateData.hotelPreferences && Array.isArray(updateData.hotelPreferences)) {
                await supabaseAdmin
                    .from('hotel_preferences')
                    .delete()
                    .eq('itinerary_id', itineraryId);

                if (updateData.hotelPreferences.length > 0) {
                    const hotelPrefsToInsert = updateData.hotelPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        itinerary_id: itineraryId,
                        preference_order: index + 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));

                    const { error } = await supabaseAdmin
                        .from('hotel_preferences')
                        .insert(hotelPrefsToInsert);

                    if (error) throw new Error(`Failed to update hotel preferences: ${error.message}`);
                }
            }


            if (updateData.visaPreferences && Array.isArray(updateData.visaPreferences)) {
                await supabaseAdmin
                    .from('visa_preferences')
                    .delete()
                    .eq('itinerary_id', itineraryId);

                if (updateData.visaPreferences.length > 0) {
                    const visaPrefsToInsert = updateData.visaPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        itinerary_id: itineraryId,
                        preference_order: index + 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));

                    const { error } = await supabaseAdmin
                        .from('visa_preferences')
                        .insert(visaPrefsToInsert);

                    if (error) throw new Error(`Failed to update visa preferences: ${error.message}`);
                }
            }


            return this.getByItineraryId(itineraryId);
        } catch (error) {
            console.error('Error in updatePreferences:', error);
            throw new Error(`Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Delete all preferences for an itinerary
     */
    async deleteByItineraryId(itineraryId: string): Promise<void> {
        try {
            await Promise.all([
                supabaseAdmin
                    .from('flight_preferences')
                    .delete()
                    .eq('itinerary_id', itineraryId),

                supabaseAdmin
                    .from('hotel_preferences')
                    .delete()
                    .eq('itinerary_id', itineraryId),

                supabaseAdmin
                    .from('visa_preferences')
                    .delete()
                    .eq('itinerary_id', itineraryId),

                supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .delete()
                    .eq('itinerary_id', itineraryId)
            ]);
        } catch (error) {
            console.error('Error in deleteByItineraryId:', error);
            throw new Error(`Failed to delete preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Check if itinerary has any preferences
     */
    async hasPreferences(itineraryId: string): Promise<boolean> {
        try {
            const result = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('id')
                .eq('itinerary_id', itineraryId)
                .single();

            return !result.error;
        } catch (error) {
            return false;
        }
    },

    /**
     * Transform frontend form data to database format
     */
    transformFormData(formData: IFrontendFormData): ICombinedPreferenceData {
        const { itineraryData, flightOptions = [], hotelOptions = [], visaOptions = [], userPreferences } = formData;

        return {
            itineraryId: itineraryData.id,
            flightPreferences: flightOptions.map((flight: any, index: number) => ({
                preference_order: index + 1,
                airline: flight.airline || '',
                route: flight.route || '',
                stops: flight.stops || '',
                cabin_class: flight.cabinClass || '',
                estimated_price_per_person: flight.estimatedPricePerPerson ?
                    parseFloat(flight.estimatedPricePerPerson) : 0,
                departure_arrival_time: flight.departureArrivalTime || '',
                fare_type: flight.fareType || '',
                preferred_time_slot: flight.preferredTimeSlot || '',
                better_connection_duration: flight.betterConnectionDuration || '',
                flexible_schedule: Boolean(flight.flexibleSchedule)
            })),
            hotelPreferences: hotelOptions.map((hotel: any, index: number) => ({
                preference_order: index + 1,
                hotel_category: hotel.hotelCategory || '',
                meal_plan: hotel.mealPlan || '',
                estimated_price_per_night: hotel.estimatedPricePerNight ?
                    parseFloat(hotel.estimatedPricePerNight) : 0,
                estimated_total_stay_cost: hotel.estimatedTotalStayCost ?
                    parseFloat(hotel.estimatedTotalStayCost) : 0,
                stay_type: hotel.stayType || '',
                location: hotel.location || '',
                room_type: hotel.roomType || '',
                better_location: hotel.betterLocation || '',
                premium_amenities: hotel.premiumAmenities || '',
                experience_highlights: hotel.experienceHighlights || ''
            })),
            visaPreferences: visaOptions.map((visa: any, index: number) => ({
                preference_order: index + 1,
                visa_type: visa.visaType || '',
                processing_time: visa.processingTime || '',
                estimated_total_cost: visa.estimatedTotalCost ?
                    parseFloat(visa.estimatedTotalCost) : 0,
                document_checklist: visa.documentChecklist || '',
                special_requirements: visa.specialRequirements || ''
            })),
            userPreferences: {
                flightPreferencesAdded: userPreferences.flightPreferencesAdded || false,
                hotelPreferencesAdded: userPreferences.hotelPreferencesAdded || false,
                visaPreferencesAdded: userPreferences.visaPreferencesAdded || false,
                lastUpdated: userPreferences.lastUpdated || new Date().toISOString(),
                metadata: {
                    source: 'frontend_form',
                    imported_at: new Date().toISOString(),
                    frontend_metadata: formData.metadata
                }
            }
        };
    },

    /**
     * Get flight preference by ID
     */
    async getFlightPreferenceById(id: string): Promise<IFlightPreference | null> {
        try {
            const { data, error } = await supabaseAdmin
                .from('flight_preferences')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch flight preference: ${error.message}`);
            }

            return data as IFlightPreference;
        } catch (error) {
            console.error('Error in getFlightPreferenceById:', error);
            throw new Error(`Failed to fetch flight preference: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get hotel preference by ID
     */
    async getHotelPreferenceById(id: string): Promise<IHotelPreference | null> {
        try {
            const { data, error } = await supabaseAdmin
                .from('hotel_preferences')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch hotel preference: ${error.message}`);
            }

            return data as IHotelPreference;
        } catch (error) {
            console.error('Error in getHotelPreferenceById:', error);
            throw new Error(`Failed to fetch hotel preference: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get visa preference by ID
     */
    async getVisaPreferenceById(id: string): Promise<IVisaPreference | null> {
        try {
            const { data, error } = await supabaseAdmin
                .from('visa_preferences')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch visa preference: ${error.message}`);
            }

            return data as IVisaPreference;
        } catch (error) {
            console.error('Error in getVisaPreferenceById:', error);
            throw new Error(`Failed to fetch visa preference: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get user preferences summary by ID
     */
    async getUserPreferencesSummaryById(id: string): Promise<IUserPreferencesSummary | null> {
        try {
            const { data, error } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch user preferences summary: ${error.message}`);
            }

            return data as IUserPreferencesSummary;
        } catch (error) {
            console.error('Error in getUserPreferencesSummaryById:', error);
            throw new Error(`Failed to fetch user preferences summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get preference by ID with type detection
     */
    async getPreferenceById(
        id: string
    ): Promise<{
        type: 'flight' | 'hotel' | 'visa' | 'summary';
        data:
        | IFlightPreference
        | IHotelPreference
        | IVisaPreference
        | IUserPreferencesSummary
        | null;
    }> {
        try {
            let data:
                | IFlightPreference
                | IHotelPreference
                | IVisaPreference
                | IUserPreferencesSummary
                | null;

            data = await this.getFlightPreferenceById(id);
            if (data) {
                return { type: 'flight', data };
            }

            data = await this.getHotelPreferenceById(id);
            if (data) {
                return { type: 'hotel', data };
            }

            data = await this.getVisaPreferenceById(id);
            if (data) {
                return { type: 'visa', data };
            }

            data = await this.getUserPreferencesSummaryById(id);
            if (data) {
                return { type: 'summary', data };
            }

            return { type: 'summary', data: null };
        } catch (error) {
            console.error('Error in getPreferenceById:', error);
            throw new Error(
                `Failed to fetch preference: ${error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    },
};