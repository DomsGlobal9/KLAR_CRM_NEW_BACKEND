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
            const exists = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('id')
                .eq('itinerary_id', itineraryId)
                .maybeSingle();

            if (exists.data) {
                throw new Error(`Cannot create: preferences already exist for itinerary ${itineraryId}. Use update instead.`);
            }

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



    /**
     * Get all unique itinerary IDs from all tables
     */
    async getAllItineraryIds(): Promise<string[]> {
        try {

            const [
                flightItinerariesResult,
                hotelItinerariesResult,
                visaItinerariesResult,
                summaryItinerariesResult
            ] = await Promise.all([
                supabaseAdmin
                    .from('flight_preferences')
                    .select('itinerary_id')
                    .order('created_at', { ascending: false }),

                supabaseAdmin
                    .from('hotel_preferences')
                    .select('itinerary_id')
                    .order('created_at', { ascending: false }),

                supabaseAdmin
                    .from('visa_preferences')
                    .select('itinerary_id')
                    .order('created_at', { ascending: false }),

                supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .select('itinerary_id')
                    .order('created_at', { ascending: false })
            ]);


            const allItineraryIds = new Set<string>();


            flightItinerariesResult.data?.forEach(item => {
                if (item.itinerary_id) allItineraryIds.add(item.itinerary_id);
            });


            hotelItinerariesResult.data?.forEach(item => {
                if (item.itinerary_id) allItineraryIds.add(item.itinerary_id);
            });


            visaItinerariesResult.data?.forEach(item => {
                if (item.itinerary_id) allItineraryIds.add(item.itinerary_id);
            });


            summaryItinerariesResult.data?.forEach(item => {
                if (item.itinerary_id) allItineraryIds.add(item.itinerary_id);
            });

            return Array.from(allItineraryIds);
        } catch (error) {
            console.error('Error in getAllItineraryIds:', error);
            throw new Error(`Failed to get itinerary IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get all itineraries with pagination
     */
    async getAllItinerariesPaginated(params?: {
        page?: number;
        limit?: number;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }): Promise<{
        itineraries: IItineraryPreferencesResponse[];
        total_count: number;
        page: number;
        limit: number;
        total_pages: number;
    }> {
        try {
            const page = params?.page || 1;
            const limit = params?.limit || 50;
            const sortBy = params?.sort_by || 'updated_at';
            const sortOrder = params?.sort_order || 'desc';


            const allItineraryIds = await this.getAllItineraryIds();
            const totalCount = allItineraryIds.length;

            if (totalCount === 0) {
                return {
                    itineraries: [],
                    total_count: 0,
                    page,
                    limit,
                    total_pages: 0
                };
            }


            const totalPages = Math.ceil(totalCount / limit);
            const currentPage = Math.max(1, Math.min(page, totalPages));
            const startIndex = (currentPage - 1) * limit;
            const endIndex = Math.min(startIndex + limit, totalCount);


            const paginatedItineraryIds = allItineraryIds.slice(startIndex, endIndex);


            const itineraries = await Promise.all(
                paginatedItineraryIds.map(itineraryId =>
                    this.getByItineraryId(itineraryId).catch(error => {
                        console.error(`Error fetching itinerary ${itineraryId}:`, error);
                        return null;
                    })
                )
            );


            const validItineraries = itineraries.filter(Boolean) as IItineraryPreferencesResponse[];

            return {
                itineraries: validItineraries,
                total_count: totalCount,
                page: currentPage,
                limit,
                total_pages: totalPages
            };
        } catch (error) {
            console.error('Error in getAllItinerariesPaginated:', error);
            throw new Error(`Failed to get all itineraries: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get summary statistics of all itineraries
     */
    async getAllItinerariesSummary(): Promise<{
        total_itineraries: number;
        total_flight_preferences: number;
        total_hotel_preferences: number;
        total_visa_preferences: number;
        itineraries_with_flight_prefs: number;
        itineraries_with_hotel_prefs: number;
        itineraries_with_visa_prefs: number;
        complete_itineraries: number;
        recent_itineraries_last_7_days: number;
        recent_itineraries_last_30_days: number;
    }> {
        try {

            const allItineraryIds = await this.getAllItineraryIds();

            if (allItineraryIds.length === 0) {
                return {
                    total_itineraries: 0,
                    total_flight_preferences: 0,
                    total_hotel_preferences: 0,
                    total_visa_preferences: 0,
                    itineraries_with_flight_prefs: 0,
                    itineraries_with_hotel_prefs: 0,
                    itineraries_with_visa_prefs: 0,
                    complete_itineraries: 0,
                    recent_itineraries_last_7_days: 0,
                    recent_itineraries_last_30_days: 0
                };
            }


            const allItineraries = await Promise.all(
                allItineraryIds.map(itineraryId =>
                    this.getByItineraryId(itineraryId).catch(() => null)
                )
            );


            const validItineraries = allItineraries.filter(Boolean) as IItineraryPreferencesResponse[];


            let totalFlightPrefs = 0;
            let totalHotelPrefs = 0;
            let totalVisaPrefs = 0;
            let itinerariesWithFlightPrefs = 0;
            let itinerariesWithHotelPrefs = 0;
            let itinerariesWithVisaPrefs = 0;
            let completeItineraries = 0;
            let recent7Days = 0;
            let recent30Days = 0;

            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            validItineraries.forEach(itinerary => {

                totalFlightPrefs += itinerary.flight_preferences.length;
                totalHotelPrefs += itinerary.hotel_preferences.length;
                totalVisaPrefs += itinerary.visa_preferences.length;


                if (itinerary.flight_preferences.length > 0) itinerariesWithFlightPrefs++;
                if (itinerary.hotel_preferences.length > 0) itinerariesWithHotelPrefs++;
                if (itinerary.visa_preferences.length > 0) itinerariesWithVisaPrefs++;


                if (itinerary.flight_preferences.length > 0 &&
                    itinerary.hotel_preferences.length > 0 &&
                    itinerary.visa_preferences.length > 0) {
                    completeItineraries++;
                }


                const lastUpdated = new Date(itinerary.user_preferences_summary?.last_updated || itinerary.flight_preferences[0]?.created_at || itinerary.hotel_preferences[0]?.created_at || itinerary.visa_preferences[0]?.created_at || '2000-01-01');

                if (lastUpdated > sevenDaysAgo) recent7Days++;
                if (lastUpdated > thirtyDaysAgo) recent30Days++;
            });

            return {
                total_itineraries: validItineraries.length,
                total_flight_preferences: totalFlightPrefs,
                total_hotel_preferences: totalHotelPrefs,
                total_visa_preferences: totalVisaPrefs,
                itineraries_with_flight_prefs: itinerariesWithFlightPrefs,
                itineraries_with_hotel_prefs: itinerariesWithHotelPrefs,
                itineraries_with_visa_prefs: itinerariesWithVisaPrefs,
                complete_itineraries: completeItineraries,
                recent_itineraries_last_7_days: recent7Days,
                recent_itineraries_last_30_days: recent30Days
            };
        } catch (error) {
            console.error('Error in getAllItinerariesSummary:', error);
            throw new Error(`Failed to get itineraries summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get recent itineraries
     */
    async getRecentItineraries(limit: number = 10): Promise<IItineraryPreferencesResponse[]> {
        try {

            const { data, error } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('itinerary_id, last_updated')
                .order('last_updated', { ascending: false })
                .limit(limit);

            if (error) {
                throw new Error(`Failed to get recent itineraries: ${error.message}`);
            }

            if (!data || data.length === 0) {
                return [];
            }


            const recentItineraries = await Promise.all(
                data.map(item =>
                    this.getByItineraryId(item.itinerary_id).catch(() => null)
                )
            );


            const validItineraries = recentItineraries.filter(Boolean) as IItineraryPreferencesResponse[];

            return validItineraries.sort((a, b) => {
                const dateA = new Date(a.user_preferences_summary?.last_updated || '2000-01-01');
                const dateB = new Date(b.user_preferences_summary?.last_updated || '2000-01-01');
                return dateB.getTime() - dateA.getTime();
            });
        } catch (error) {
            console.error('Error in getRecentItineraries:', error);
            throw new Error(`Failed to get recent itineraries: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get itineraries by date range
     */
    async getItinerariesByDateRange(params: {
        start_date: string;
        end_date: string;
        field?: 'created_at' | 'updated_at' | 'last_updated';
    }): Promise<IItineraryPreferencesResponse[]> {
        try {
            const { start_date, end_date, field = 'last_updated' } = params;


            let tableName = 'user_itenary_preferences_summary';
            let fieldName = 'last_updated';

            if (field === 'created_at') {
                tableName = 'user_itenary_preferences_summary';
                fieldName = 'created_at';
            } else if (field === 'updated_at') {
                tableName = 'user_itenary_preferences_summary';
                fieldName = 'updated_at';
            }


            const { data, error } = await supabaseAdmin
                .from(tableName)
                .select('itinerary_id')
                .gte(fieldName, start_date)
                .lte(fieldName, end_date)
                .order(fieldName, { ascending: false });

            if (error) {
                throw new Error(`Failed to get itineraries by date range: ${error.message}`);
            }

            if (!data || data.length === 0) {
                return [];
            }


            const itineraryIds = [...new Set(data.map(item => item.itinerary_id))];


            const itineraries = await Promise.all(
                itineraryIds.map(itineraryId =>
                    this.getByItineraryId(itineraryId).catch(() => null)
                )
            );


            const validItineraries = itineraries.filter(Boolean) as IItineraryPreferencesResponse[];


            return validItineraries.sort((a, b) => {
                let dateA: Date, dateB: Date;

                if (field === 'created_at') {
                    dateA = new Date(a.flight_preferences[0]?.created_at || a.hotel_preferences[0]?.created_at || a.visa_preferences[0]?.created_at || '2000-01-01');
                    dateB = new Date(b.flight_preferences[0]?.created_at || b.hotel_preferences[0]?.created_at || b.visa_preferences[0]?.created_at || '2000-01-01');
                } else if (field === 'updated_at') {
                    dateA = new Date(a.flight_preferences[0]?.updated_at || a.hotel_preferences[0]?.updated_at || a.visa_preferences[0]?.updated_at || '2000-01-01');
                    dateB = new Date(b.flight_preferences[0]?.updated_at || b.hotel_preferences[0]?.updated_at || b.visa_preferences[0]?.updated_at || '2000-01-01');
                } else {
                    dateA = new Date(a.user_preferences_summary?.last_updated || '2000-01-01');
                    dateB = new Date(b.user_preferences_summary?.last_updated || '2000-01-01');
                }

                return dateB.getTime() - dateA.getTime();
            });
        } catch (error) {
            console.error('Error in getItinerariesByDateRange:', error);
            throw new Error(`Failed to get itineraries by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
};