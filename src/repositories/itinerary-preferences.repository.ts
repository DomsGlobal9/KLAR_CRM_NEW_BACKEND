import { supabaseAdmin } from '../config';
import {
    IFlightPreference,
    IHotelPreference,
    IVisaPreference,
    IUserPreferencesSummary,
    IItineraryPreferencesResponse,
    ICombinedPreferenceData,
    IFrontendFormData,
    ILeadDetails
} from '../interfaces';

export const itineraryPreferencesRepository = {
    
    /**
     * Get lead_id from user preferences summary by summary ID
     */
    async getLeadIdByUserPreferenceId(
        userPreferenceId: string
    ): Promise<string | null> {
        try {
            const { data, error } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('lead_id')
                .eq('id', userPreferenceId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch lead_id: ${error.message}`);
            }

            return data.lead_id;
        } catch (error) {
            console.error('Error in getLeadIdByUserPreferenceId:', error);
            throw new Error(
                `Failed to get lead_id: ${error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    },

    /**
     * Get all preferences for a lead
     */
    async getByLeadId(clientID: string): Promise<IItineraryPreferencesResponse> {
        try {
            /**
             * Check if clientID is a user preference summary ID or lead ID
             */
            let leadId: string;

            /**
             * First check if it's a UUID (could be either)
             */
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientID);

            if (isUUID) {
                /**
                 * 
                 */
                const leadFromSummary = await this.getLeadIdByUserPreferenceId(clientID);
                if (leadFromSummary) {
                    leadId = leadFromSummary;
                } else {
                    /**
                     * Check if it's a lead ID directly
                     */
                    const { data: leadData } = await supabaseAdmin
                        .from('leads')
                        .select('id')
                        .eq('id', clientID)
                        .single();

                    if (leadData) {
                        leadId = clientID;
                    } else {
                        throw new Error("Lead ID not found");
                    }
                }
            } else {
                throw new Error("Invalid ID format");
            }

            /**
             * Fetch all data in parallel
             */
            const [
                flightPreferencesResult,
                hotelPreferencesResult,
                visaPreferencesResult,
                userPreferencesResult,
                leadDetailsResult
            ] = await Promise.all([
                supabaseAdmin
                    .from('flight_preferences')
                    .select('*')
                    .eq('lead_id', leadId)
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('hotel_preferences')
                    .select('*')
                    .eq('lead_id', leadId)
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('visa_preferences')
                    .select('*')
                    .eq('lead_id', leadId)
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .select('*')
                    .eq('lead_id', leadId)
                    .single(),

                supabaseAdmin
                    .from('leads')
                    .select('*')
                    .eq('id', leadId)
                    .single()
            ]);

            // Handle errors
            if (flightPreferencesResult.error && flightPreferencesResult.error.code !== 'PGRST116') {
                throw new Error(`Failed to fetch flight preferences: ${flightPreferencesResult.error.message}`);
            }

            if (hotelPreferencesResult.error && hotelPreferencesResult.error.code !== 'PGRST116') {
                throw new Error(`Failed to fetch hotel preferences: ${hotelPreferencesResult.error.message}`);
            }

            if (visaPreferencesResult.error && visaPreferencesResult.error.code !== 'PGRST116') {
                throw new Error(`Failed to fetch visa preferences: ${visaPreferencesResult.error.message}`);
            }

            // Handle user preferences error (allow missing summary)
            const userPrefsError = userPreferencesResult.error;
            if (userPrefsError && userPrefsError.code !== 'PGRST116') {
                console.warn('Error fetching user preferences summary:', userPrefsError.message);
            }

            // Handle lead details error (lead might not exist in our table)
            let leadDetails: ILeadDetails | undefined;
            const leadDetailsError = leadDetailsResult.error;
            if (leadDetailsError && leadDetailsError.code !== 'PGRST116') {
                console.warn('Error fetching lead details:', leadDetailsError.message);
            } else if (leadDetailsResult.data) {
                leadDetails = leadDetailsResult.data as ILeadDetails;
            }

            return {
                lead_id: leadId,
                flight_preferences: flightPreferencesResult.data as IFlightPreference[] || [],
                hotel_preferences: hotelPreferencesResult.data as IHotelPreference[] || [],
                visa_preferences: visaPreferencesResult.data as IVisaPreference[] || [],
                user_preferences_summary: userPreferencesResult.data as IUserPreferencesSummary || null,
                lead_details: leadDetails
            };
        } catch (error) {
            console.error('Error in getByLeadId:', error);
            throw new Error(`Failed to fetch lead preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Save all preferences for a lead
     */
    async saveAllPreferences(data: ICombinedPreferenceData): Promise<IItineraryPreferencesResponse> {
        const { leadId, flightPreferences, hotelPreferences, visaPreferences, userPreferences, leadDetails } = data;

        try {
            // Check if preferences already exist
            const exists = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('id')
                .eq('lead_id', leadId)
                .maybeSingle();

            if (exists.data) {
                throw new Error(`Cannot create: preferences already exist for lead ${leadId}. Use update instead.`);
            }

            // Clear existing data
            await this.deleteByLeadId(leadId);

            // Save flight preferences
            let savedFlightPreferences: IFlightPreference[] = [];
            if (flightPreferences.length > 0) {
                const flightPrefsToInsert = flightPreferences.map((pref, index) => ({
                    ...pref,
                    lead_id: leadId,
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

            // Save hotel preferences
            let savedHotelPreferences: IHotelPreference[] = [];
            if (hotelPreferences.length > 0) {
                const hotelPrefsToInsert = hotelPreferences.map((pref, index) => ({
                    ...pref,
                    lead_id: leadId,
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

            // Save visa preferences
            let savedVisaPreferences: IVisaPreference[] = [];
            if (visaPreferences.length > 0) {
                const visaPrefsToInsert = visaPreferences.map((pref, index) => ({
                    ...pref,
                    lead_id: leadId,
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

            // Save user preferences summary
            const userPrefsSummary: Omit<IUserPreferencesSummary, 'id'> = {
                lead_id: leadId,
                flight_preferences_added: userPreferences.flightPreferencesAdded,
                hotel_preferences_added: userPreferences.hotelPreferencesAdded,
                visa_preferences_added: userPreferences.visaPreferencesAdded,
                last_updated: userPreferences.lastUpdated || new Date().toISOString(),
                metadata: {
                    ...userPreferences.metadata,
                    ...(leadDetails && { lead_details_available: true })
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: userPrefsData, error: userPrefsError } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .insert(userPrefsSummary)
                .select()
                .single();

            if (userPrefsError) throw new Error(`Failed to save user preferences summary: ${userPrefsError.message}`);

            // Fetch lead details if not provided
            let leadDetailsResult: ILeadDetails | undefined = leadDetails;
            if (!leadDetailsResult) {
                try {
                    const { data: detailsData } = await supabaseAdmin
                        .from('leads')
                        .select('*')
                        .eq('id', leadId)
                        .single();

                    leadDetailsResult = detailsData as ILeadDetails;
                } catch (error) {
                    console.warn('Could not fetch lead details:', error);
                }
            }

            return {
                lead_id: leadId,
                flight_preferences: savedFlightPreferences,
                hotel_preferences: savedHotelPreferences,
                visa_preferences: savedVisaPreferences,
                user_preferences_summary: userPrefsData as IUserPreferencesSummary,
                lead_details: leadDetailsResult
            };
        } catch (error) {
            console.error('Error in saveAllPreferences:', error);
            throw new Error(`Failed to save lead preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Update specific preferences for a lead
     */
    async updatePreferences(leadId: string, updateData: any): Promise<IItineraryPreferencesResponse> {
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
                    .eq('lead_id', leadId);

                if (error) throw new Error(`Failed to update user preferences: ${error.message}`);
            }

            if (updateData.flightPreferences && Array.isArray(updateData.flightPreferences)) {
                await supabaseAdmin
                    .from('flight_preferences')
                    .delete()
                    .eq('lead_id', leadId);

                if (updateData.flightPreferences.length > 0) {
                    const flightPrefsToInsert = updateData.flightPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
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
                    .eq('lead_id', leadId);

                if (updateData.hotelPreferences.length > 0) {
                    const hotelPrefsToInsert = updateData.hotelPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
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
                    .eq('lead_id', leadId);

                if (updateData.visaPreferences.length > 0) {
                    const visaPrefsToInsert = updateData.visaPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
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

            return this.getByLeadId(leadId);
        } catch (error) {
            console.error('Error in updatePreferences:', error);
            throw new Error(`Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Delete all preferences for a lead
     */
    async deleteByLeadId(leadId: string): Promise<void> {
        try {
            await Promise.all([
                supabaseAdmin
                    .from('flight_preferences')
                    .delete()
                    .eq('lead_id', leadId),

                supabaseAdmin
                    .from('hotel_preferences')
                    .delete()
                    .eq('lead_id', leadId),

                supabaseAdmin
                    .from('visa_preferences')
                    .delete()
                    .eq('lead_id', leadId),

                supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .delete()
                    .eq('lead_id', leadId)
            ]);
        } catch (error) {
            console.error('Error in deleteByLeadId:', error);
            throw new Error(`Failed to delete preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Check if lead has any preferences
     */
    async hasPreferences(leadId: string): Promise<boolean> {
        try {
            const result = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('id')
                .eq('lead_id', leadId)
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
        const { leadData, flightOptions = [], hotelOptions = [], visaOptions = [], userPreferences } = formData;

        return {
            leadId: leadData.id,
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
     * Get all unique lead IDs from the parent table
     */
    async getAllLeadIds(): Promise<string[]> {
        try {
            const { data, error } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('lead_id')
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(`Failed to get lead IDs: ${error.message}`);
            }

            return data?.map(item => item.lead_id) || [];
        } catch (error) {
            console.error('Error in getAllLeadIds:', error);
            throw new Error(`Failed to get lead IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get all leads with pagination
     */
    async getAllLeadsPaginated(params?: {
        page?: number;
        limit?: number;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }): Promise<{
        leads: IItineraryPreferencesResponse[];
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

            // Step 1: Get paginated summaries from PARENT table first
            const { data: summaries, error: summariesError, count } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('*', { count: 'exact' })
                .order(sortBy, { ascending: sortOrder === 'asc' })
                .range((page - 1) * limit, page * limit - 1);

            if (summariesError) {
                throw new Error(`Failed to fetch summaries: ${summariesError.message}`);
            }

            if (!summaries || summaries.length === 0) {
                return {
                    leads: [],
                    total_count: count || 0,
                    page,
                    limit,
                    total_pages: Math.ceil((count || 0) / limit)
                };
            }

            // Step 2: Extract all lead IDs from summaries
            const leadIds = summaries.map(summary => summary.lead_id);

            // Step 3: Fetch all related data in parallel - including lead details
            const [
                flightPreferencesResult,
                hotelPreferencesResult,
                visaPreferencesResult,
                leadDetailsResult
            ] = await Promise.all([
                // Get all flight preferences for these leads
                supabaseAdmin
                    .from('flight_preferences')
                    .select('*')
                    .in('lead_id', leadIds)
                    .order('preference_order', { ascending: true }),

                // Get all hotel preferences for these leads
                supabaseAdmin
                    .from('hotel_preferences')
                    .select('*')
                    .in('lead_id', leadIds)
                    .order('preference_order', { ascending: true }),

                // Get all visa preferences for these leads
                supabaseAdmin
                    .from('visa_preferences')
                    .select('*')
                    .in('lead_id', leadIds)
                    .order('preference_order', { ascending: true }),

                // Get lead details from leads table
                supabaseAdmin
                    .from('leads')
                    .select('*')
                    .in('id', leadIds)
            ]);

            // Step 4: Create maps for quick lookup
            const flightPreferencesMap = new Map<string, IFlightPreference[]>();
            const hotelPreferencesMap = new Map<string, IHotelPreference[]>();
            const visaPreferencesMap = new Map<string, IVisaPreference[]>();
            const leadDetailsMap = new Map<string, ILeadDetails>();

            // Group flight preferences by lead_id
            flightPreferencesResult.data?.forEach(fp => {
                const existing = flightPreferencesMap.get(fp.lead_id) || [];
                flightPreferencesMap.set(fp.lead_id, [...existing, fp as IFlightPreference]);
            });

            // Group hotel preferences by lead_id
            hotelPreferencesResult.data?.forEach(hp => {
                const existing = hotelPreferencesMap.get(hp.lead_id) || [];
                hotelPreferencesMap.set(hp.lead_id, [...existing, hp as IHotelPreference]);
            });

            // Group visa preferences by lead_id
            visaPreferencesResult.data?.forEach(vp => {
                const existing = visaPreferencesMap.get(vp.lead_id) || [];
                visaPreferencesMap.set(vp.lead_id, [...existing, vp as IVisaPreference]);
            });

            // Create lead details map
            leadDetailsResult.data?.forEach(lead => {
                leadDetailsMap.set(lead.id, lead as ILeadDetails);
            });

            // Step 5: Combine all data
            const leads = summaries.map(summary => ({
                lead_id: summary.lead_id,
                flight_preferences: flightPreferencesMap.get(summary.lead_id) || [],
                hotel_preferences: hotelPreferencesMap.get(summary.lead_id) || [],
                visa_preferences: visaPreferencesMap.get(summary.lead_id) || [],
                user_preferences_summary: summary as IUserPreferencesSummary,
                lead_details: leadDetailsMap.get(summary.lead_id)
            }));

            return {
                leads,
                total_count: count || 0,
                page,
                limit,
                total_pages: Math.ceil((count || 0) / limit)
            };
        } catch (error) {
            console.error('Error in getAllLeadsPaginated:', error);
            throw new Error(`Failed to get all leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get summary statistics of all leads
     */
    async getAllLeadsSummary(): Promise<{
        total_leads: number;
        total_flight_preferences: number;
        total_hotel_preferences: number;
        total_visa_preferences: number;
        leads_with_flight_prefs: number;
        leads_with_hotel_prefs: number;
        leads_with_visa_prefs: number;
        complete_leads: number;
        recent_leads_last_7_days: number;
        recent_leads_last_30_days: number;
    }> {
        try {
            const { count: totalLeads, error: countError } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('*', { count: 'exact', head: true });

            if (countError) {
                throw new Error(`Failed to get total count: ${countError.message}`);
            }

            const [
                flightCountResult,
                hotelCountResult,
                visaCountResult
            ] = await Promise.all([
                supabaseAdmin
                    .from('flight_preferences')
                    .select('lead_id', { count: 'exact', head: true }),
                supabaseAdmin
                    .from('hotel_preferences')
                    .select('lead_id', { count: 'exact', head: true }),
                supabaseAdmin
                    .from('visa_preferences')
                    .select('lead_id', { count: 'exact', head: true })
            ]);

            const [
                distinctFlightLeads,
                distinctHotelLeads,
                distinctVisaLeads
            ] = await Promise.all([
                supabaseAdmin
                    .from('flight_preferences')
                    .select('lead_id')
                    .limit(1),
                supabaseAdmin
                    .from('hotel_preferences')
                    .select('lead_id')
                    .limit(1),
                supabaseAdmin
                    .from('visa_preferences')
                    .select('lead_id')
                    .limit(1)
            ]);

            // Get recent summaries for date calculations
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { count: recent7DaysCount } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('*', { count: 'exact', head: true })
                .gte('last_updated', sevenDaysAgo.toISOString());

            const { count: recent30DaysCount } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('*', { count: 'exact', head: true })
                .gte('last_updated', thirtyDaysAgo.toISOString());

            // Get complete leads (have all three preference types)
            const { data: completeLeadsData } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('lead_id')
                .eq('flight_preferences_added', true)
                .eq('hotel_preferences_added', true)
                .eq('visa_preferences_added', true);

            return {
                total_leads: totalLeads || 0,
                total_flight_preferences: flightCountResult.count || 0,
                total_hotel_preferences: hotelCountResult.count || 0,
                total_visa_preferences: visaCountResult.count || 0,
                leads_with_flight_prefs: distinctFlightLeads.data?.length || 0,
                leads_with_hotel_prefs: distinctHotelLeads.data?.length || 0,
                leads_with_visa_prefs: distinctVisaLeads.data?.length || 0,
                complete_leads: completeLeadsData?.length || 0,
                recent_leads_last_7_days: recent7DaysCount || 0,
                recent_leads_last_30_days: recent30DaysCount || 0
            };
        } catch (error) {
            console.error('Error in getAllLeadsSummary:', error);
            throw new Error(`Failed to get leads summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get recent leads with lead details
     */
    async getRecentLeads(limit: number = 10): Promise<IItineraryPreferencesResponse[]> {
        try {
            // Get recent summaries with lead details
            const { data, error } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select(`
                *,
                leads:lead_id (*)
            `)
                .order('last_updated', { ascending: false })
                .limit(limit);

            if (error) {
                throw new Error(`Failed to get recent leads: ${error.message}`);
            }

            if (!data || data.length === 0) {
                return [];
            }

            // Extract lead IDs
            const leadIds = data.map(item => item.lead_id);

            // Fetch all preferences in bulk
            const [
                flightPreferencesResult,
                hotelPreferencesResult,
                visaPreferencesResult
            ] = await Promise.all([
                supabaseAdmin
                    .from('flight_preferences')
                    .select('*')
                    .in('lead_id', leadIds)
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('hotel_preferences')
                    .select('*')
                    .in('lead_id', leadIds)
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('visa_preferences')
                    .select('*')
                    .in('lead_id', leadIds)
                    .order('preference_order', { ascending: true })
            ]);

            // Create maps
            const flightPreferencesMap = new Map<string, IFlightPreference[]>();
            const hotelPreferencesMap = new Map<string, IHotelPreference[]>();
            const visaPreferencesMap = new Map<string, IVisaPreference[]>();

            flightPreferencesResult.data?.forEach(fp => {
                const existing = flightPreferencesMap.get(fp.lead_id) || [];
                flightPreferencesMap.set(fp.lead_id, [...existing, fp as IFlightPreference]);
            });

            hotelPreferencesResult.data?.forEach(hp => {
                const existing = hotelPreferencesMap.get(hp.lead_id) || [];
                hotelPreferencesMap.set(hp.lead_id, [...existing, hp as IHotelPreference]);
            });

            visaPreferencesResult.data?.forEach(vp => {
                const existing = visaPreferencesMap.get(vp.lead_id) || [];
                visaPreferencesMap.set(vp.lead_id, [...existing, vp as IVisaPreference]);
            });

            // Combine data
            const leads = data.map(item => ({
                lead_id: item.lead_id,
                flight_preferences: flightPreferencesMap.get(item.lead_id) || [],
                hotel_preferences: hotelPreferencesMap.get(item.lead_id) || [],
                visa_preferences: visaPreferencesMap.get(item.lead_id) || [],
                user_preferences_summary: item as IUserPreferencesSummary,
                lead_details: item.leads as ILeadDetails
            }));

            return leads.sort((a, b) => {
                const dateA = new Date(a.user_preferences_summary?.last_updated || '2000-01-01');
                const dateB = new Date(b.user_preferences_summary?.last_updated || '2000-01-01');
                return dateB.getTime() - dateA.getTime();
            });
        } catch (error) {
            console.error('Error in getRecentLeads:', error);
            throw new Error(`Failed to get recent leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Get leads by date range
     */
    async getLeadsByDateRange(params: {
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
                .select('lead_id')
                .gte(fieldName, start_date)
                .lte(fieldName, end_date)
                .order(fieldName, { ascending: false });

            if (error) {
                throw new Error(`Failed to get leads by date range: ${error.message}`);
            }

            if (!data || data.length === 0) {
                return [];
            }

            // Get unique lead IDs
            const leadIds = [...new Set(data.map(item => item.lead_id))];

            // Fetch lead details
            const leads = await Promise.all(
                leadIds.map(leadId =>
                    this.getByLeadId(leadId).catch(() => null)
                )
            );

            // Filter out null results
            const validLeads = leads.filter(Boolean) as IItineraryPreferencesResponse[];

            // Sort by date field
            return validLeads.sort((a, b) => {
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
            console.error('Error in getLeadsByDateRange:', error);
            throw new Error(`Failed to get leads by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
};