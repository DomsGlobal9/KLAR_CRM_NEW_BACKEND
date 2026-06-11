import { supabaseAdmin } from '../config';
import {
    IFlightPreference,
    IHotelPreference,
    IVisaPreference,
    IUserPreferencesSummary,
    IItineraryPreferencesResponse,
    ICombinedPreferenceData,
    IFrontendFormData,
    ILeadDetails,
    IRoleFilter
} from '../interfaces/itinerary-preferences.interface';

export const itineraryPreferencesRepository = {

    async getLeadIdByItineraryId(itinerary_id: string) {
        if (itinerary_id) {
            const { data: itineraryData, error: itineraryError } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('lead_id')
                .eq('id', itinerary_id)
                .maybeSingle();
            if (itineraryError || !itineraryData) {
                throw new Error(`Failed to fetch lead_id: ${itineraryError?.message || 'No data found'}`);
            }

            const leadId = itineraryData.lead_id;

            if (leadId) {
                return leadId
            }
        }
    },

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
    async getByItineraryId(itinerary_id: string): Promise<IItineraryPreferencesResponse> {
        try {

            const { data: itineraryData, error: itineraryError } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('lead_id')
                .eq('id', itinerary_id)
                .maybeSingle();

            if (itineraryError || !itineraryData) {
                throw new Error(`Failed to fetch lead_id: ${itineraryError?.message || 'No data found'}`);
            }

            const clientID = itineraryData.lead_id;

            const [
                flightPreferencesResult,
                hotelPreferencesResult,
                visaPreferencesResult,
                userPreferencesResult,
                servicePreferencesResult,
                leadDetailsResult
            ] = await Promise.all([
                supabaseAdmin
                    .from('flight_preferences')
                    .select('*')
                    .eq('lead_id', clientID)
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('hotel_preferences')
                    .select('*')
                    .eq('lead_id', clientID)
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('visa_preferences')
                    .select('*')
                    .eq('lead_id', clientID)
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .select('*')
                    .eq('lead_id', clientID)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle(),

                supabaseAdmin
                    .from('service_preferences')
                    .select('*')
                    .eq('lead_id', clientID),

                supabaseAdmin
                    .from('leads')
                    .select('*')
                    .eq('id', clientID)
                    .single()
            ]);

            if (servicePreferencesResult.error && servicePreferencesResult.error.code !== 'PGRST116') {
                throw new Error(`Failed to fetch service preferences: ${servicePreferencesResult.error.message}`);
            }

            let leadDetails: ILeadDetails | undefined;
            if (leadDetailsResult.data) {
                leadDetails = leadDetailsResult.data as ILeadDetails;
            }

            return {
                flight_preferences: flightPreferencesResult.data ?? [],
                hotel_preferences: hotelPreferencesResult.data ?? [],
                visa_preferences: visaPreferencesResult.data ?? [],
                service_preferences: servicePreferencesResult.data ?? [],
                user_preferences_summary: userPreferencesResult.data ?? null,
                lead_details: leadDetails
            };
        } catch (error) {
            console.error('Error in getByItineraryId:', error);
            throw new Error(`Failed to fetch lead preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    /**
     * Save all preferences for a lead
     */
    async saveAllPreferences(data: ICombinedPreferenceData): Promise<IItineraryPreferencesResponse> {
        const { leadId, flightPreferences, hotelPreferences, visaPreferences, userPreferences, leadDetails } = data;

        try {

            const exists = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('id')
                .eq('lead_id', leadId)
                .maybeSingle();

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
    async updatePreferences(
        updateData: any,
        itinerary_id: string,
    ): Promise<IItineraryPreferencesResponse> {
        try {

            const { data: existingItinerary, error: verifyError } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('id, lead_id')
                .eq('id', itinerary_id)
                .single();

            if (verifyError || !existingItinerary) {
                throw new Error(`Itinerary ${itinerary_id} not found`);
            }

            const leadId = existingItinerary.lead_id;

            if (!leadId) {
                throw new Error(`Lead ID not found for itinerary ${itinerary_id}`);
            }

            // Update user preferences summary (your existing code remains)
            if (updateData.userPreferences) {
                const { data: existingSummary, error: fetchError } = await supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .select('*')
                    .eq('id', itinerary_id)
                    .single();

                if (!fetchError && existingSummary) {
                    const updateFields: any = {
                        updated_at: new Date().toISOString()
                    };

                    const userPrefFields = [
                        'flight_preferences_added',
                        'hotel_preferences_added',
                        'visa_preferences_added',
                        'transfer_preferences_added',
                        'group_booking_preferences_added',
                        'tour_package_preferences_added',
                        'aircraft_charter_preferences_added',
                        'event_management_preferences_added',
                        'yacht_charter_preferences_added'
                    ];

                    for (const field of userPrefFields) {
                        const fieldMap: Record<string, string> = {
                            'flight_preferences_added': 'flightPreferencesAdded',
                            'hotel_preferences_added': 'hotelPreferencesAdded',
                            'visa_preferences_added': 'visaPreferencesAdded',
                            'transfer_preferences_added': 'transferPreferencesAdded',
                            'group_booking_preferences_added': 'groupBookingPreferencesAdded',
                            'tour_package_preferences_added': 'tourPackagePreferencesAdded',
                            'aircraft_charter_preferences_added': 'aircraftCharterPreferencesAdded',
                            'event_management_preferences_added': 'eventManagementPreferencesAdded',
                            'yacht_charter_preferences_added': 'yachtCharterPreferencesAdded'
                        };

                        const payloadField = fieldMap[field];
                        if (payloadField && updateData.userPreferences[payloadField] !== undefined) {
                            updateFields[field] = updateData.userPreferences[payloadField];
                        }
                    }

                    if (updateData.userPreferences.lastUpdated !== undefined) {
                        updateFields.last_updated = updateData.userPreferences.lastUpdated;
                    }

                    if (updateData.userPreferences.metadata !== undefined) {
                        updateFields.metadata = {
                            ...(existingSummary.metadata || {}),
                            ...updateData.userPreferences.metadata
                        };
                    }

                    if (Object.keys(updateFields).length > 1) {
                        const { error: updateError } = await supabaseAdmin
                            .from('user_itenary_preferences_summary')
                            .update(updateFields)
                            .eq('id', itinerary_id);

                        if (updateError) {
                            throw new Error(`Failed to update user preferences: ${updateError.message}`);
                        }
                    }
                }
            }

            // Handle service preferences - DELETE ALL EXISTING FIRST
            if (updateData.service_preferences !== undefined && Array.isArray(updateData.service_preferences)) {

                // Delete all existing service preferences for this itinerary
                const { error: deleteError } = await supabaseAdmin
                    .from('service_preferences')
                    .delete()
                    .eq('itinerary_id', itinerary_id);

                if (deleteError) {
                    console.error('Error deleting existing preferences:', deleteError);
                }

                // Insert all new preferences
                for (const pref of updateData.service_preferences) {
                    const insertData: any = {
                        service_type: pref.service_type?.toUpperCase(),
                        service_code: pref.service_code || pref.service_type,
                        title: pref.title,
                        description: pref.description,
                        estimated_price: pref.estimated_price,
                        currency: pref.currency || 'INR',
                        preference_order: pref.preference_order,
                        is_active: pref.is_active !== undefined ? pref.is_active : true,
                        preferences: pref.preferences || {},
                        metadata: pref.metadata || {},
                        itinerary_id: itinerary_id,
                        lead_id: leadId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    // Remove any undefined values
                    Object.keys(insertData).forEach(key => {
                        if (insertData[key] === undefined || insertData[key] === null) {
                            delete insertData[key];
                        }
                    });

                    const { error: insertError } = await supabaseAdmin
                        .from('service_preferences')
                        .insert(insertData);

                    if (insertError) {
                        console.error('Insert error:', insertError);
                        throw new Error(`Failed to insert service preference: ${insertError.message}`);
                    }
                }
            }

            return this.getByItineraryId(itinerary_id);

        } catch (error) {
            console.error('Update error:', error);
            throw new Error(
                `Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    },

    /**
     * Deep merge preferences objects
     * Preserves existing data while updating only the fields provided
     */
    deepMergePreferences(existing: any, incoming: any): any {
        const merged = { ...existing };

        for (const key in incoming) {
            if (incoming.hasOwnProperty(key)) {
                if (incoming[key] !== undefined && incoming[key] !== null) {
                    if (typeof incoming[key] === 'object' &&
                        !Array.isArray(incoming[key]) &&
                        incoming[key] !== null) {

                        merged[key] = this.deepMergePreferences(
                            merged[key] || {},
                            incoming[key]
                        );
                    }
                    else if (Array.isArray(incoming[key])) {
                        merged[key] = incoming[key];
                    }
                    else {
                        merged[key] = incoming[key];
                    }
                }
            }
        }

        return merged;
    },

    /**
     * Delete all preferences for a lead
     */
    async deleteByLeadId(itinerary_id: string): Promise<void> {
        try {

            const { data: itineraryData, error: itineraryError } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('lead_id')
                .eq('id', itinerary_id)
                .maybeSingle();

            if (itineraryError || !itineraryData) {
                throw new Error(`Failed to fetch lead_id: ${itineraryError?.message || 'No data found'}`);
            }

            const leadId = itineraryData.lead_id;

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
                flexible_schedule: Boolean(flight.flexibleSchedule),
                // NEW FIELDS - Map from payload
                trip_type: flight.tripType || 'one-way',
                departure_city: flight.departureCity || '',
                arrival_city: flight.arrivalCity || '',
                departure_date: flight.departureDate || null,
                arrival_date: flight.arrivalDate || null,
                return_departure_date: flight.returnDepartureDate || null,
                return_arrival_date: flight.returnArrivalDate || null,
                segments: flight.segments || [],
                estimated_total_price: flight.estimatedPricePerPerson ? parseFloat(flight.estimatedPricePerPerson) : 0,
                currency: 'INR',
                status: 'draft',
                route_details: {
                    trip_type: flight.tripType,
                    stops: flight.stops,
                    preferred_time_slot: flight.preferredTimeSlot,
                    better_connection_duration: flight.betterConnectionDuration,
                    flexible_schedule: Boolean(flight.flexibleSchedule)
                }
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
                transferPreferencesAdded: userPreferences.transferPreferencesAdded || false,
                groupBookingPreferencesAdded: userPreferences.groupBookingPreferencesAdded || false,
                tourPackagePreferencesAdded: userPreferences.tourPackagePreferencesAdded || false,
                aircraftCharterPreferencesAdded: userPreferences.aircraftCharterPreferencesAdded || false,
                eventManagementPreferencesAdded: userPreferences.eventManagementPreferencesAdded || false,
                yachtCharterPreferencesAdded: userPreferences.yachtCharterPreferencesAdded || false,
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
    }, roleFilter?: IRoleFilter): Promise<{
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

            /**
             * Step 1: Build base query with role-based filtering
             */
            let query = supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('*', { count: 'exact' })
                .order(sortBy, { ascending: sortOrder === 'asc' });

            if (roleFilter?.role === 'rm' && roleFilter?.userId) {
                query = query.eq('leads.assigned_to', roleFilter.userId);
            }

            const { data: summaries, error: summariesError, count } = await query
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

            /**
             * Step 2: Extract all lead IDs from summaries
             */
            const leadIds = summaries.map(summary => summary.lead_id);

            /**
             * Step 3: Fetch all related data in parallel
             */
            const [
                flightPreferencesResult,
                hotelPreferencesResult,
                visaPreferencesResult,
                leadDetailsResult
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
                    .order('preference_order', { ascending: true }),

                supabaseAdmin
                    .from('leads')
                    .select('*')
                    .in('id', leadIds)
            ]);

            /**
             * Step 4: Create maps for quick lookup
             */
            const flightPreferencesMap = new Map<string, IFlightPreference[]>();
            const hotelPreferencesMap = new Map<string, IHotelPreference[]>();
            const visaPreferencesMap = new Map<string, IVisaPreference[]>();
            const leadDetailsMap = new Map<string, ILeadDetails>();

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

            leadDetailsResult.data?.forEach(lead => {
                leadDetailsMap.set(lead.id, lead as ILeadDetails);
            });

            /**
             * Step 5: Combine all data
             */
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


    async getAllLeadsBasicPaginated(params?: {
        page?: number;
        limit?: number;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }, roleFilter?: IRoleFilter): Promise<{
        leads: Array<{
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
        }>;
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

            /**
             * Step 1: Build base query with role-based filtering
             */
            let query = supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('*', { count: 'exact' })
                .order(sortBy, { ascending: sortOrder === 'asc' });

            // Apply RM role filter
            if (roleFilter?.role === 'rm' && roleFilter?.userId) {
                query = query.eq('leads.assigned_to', roleFilter.userId);
            }

            const { data: summaries, error: summariesError, count } = await query
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

            /**
             * Step 2: Extract all lead IDs from summaries
             */
            const leadIds = summaries.map(summary => summary.lead_id);

            /**
             * Step 3: Fetch all data and count manually
             */
            const [
                flightPreferencesResult,
                hotelPreferencesResult,
                visaPreferencesResult,
                leadDetailsResult
            ] = await Promise.all([
                supabaseAdmin
                    .from('flight_preferences')
                    .select('lead_id, id')
                    .in('lead_id', leadIds),

                supabaseAdmin
                    .from('hotel_preferences')
                    .select('lead_id, id')
                    .in('lead_id', leadIds),

                supabaseAdmin
                    .from('visa_preferences')
                    .select('lead_id, id')
                    .in('lead_id', leadIds),

                supabaseAdmin
                    .from('leads')
                    .select('id, name, email, phone, status')
                    .in('id', leadIds)
            ]);

            /**
             * Step 4: Create maps for quick lookup
             */
            const flightCountsMap = new Map<string, number>();
            const hotelCountsMap = new Map<string, number>();
            const visaCountsMap = new Map<string, number>();
            const leadDetailsMap = new Map<string, { name?: string; email?: string; phone?: string; status?: string }>();

            if (flightPreferencesResult.data) {
                flightPreferencesResult.data.forEach(item => {
                    const currentCount = flightCountsMap.get(item.lead_id) || 0;
                    flightCountsMap.set(item.lead_id, currentCount + 1);
                });
            }

            if (hotelPreferencesResult.data) {
                hotelPreferencesResult.data.forEach(item => {
                    const currentCount = hotelCountsMap.get(item.lead_id) || 0;
                    hotelCountsMap.set(item.lead_id, currentCount + 1);
                });
            }

            if (visaPreferencesResult.data) {
                visaPreferencesResult.data.forEach(item => {
                    const currentCount = visaCountsMap.get(item.lead_id) || 0;
                    visaCountsMap.set(item.lead_id, currentCount + 1);
                });
            }

            if (leadDetailsResult.data) {
                leadDetailsResult.data.forEach(lead => {
                    leadDetailsMap.set(lead.id, {
                        name: lead.name,
                        email: lead.email,
                        phone: lead.phone,
                        status: lead.status
                    });
                });
            }

            /**
             * Step 5: Combine all basic data
             */
            const leads = summaries.map(summary => ({
                lead_id: summary.lead_id,
                lead_details: leadDetailsMap.get(summary.lead_id) || undefined,
                flight_preferences_count: flightCountsMap.get(summary.lead_id) || 0,
                hotel_preferences_count: hotelCountsMap.get(summary.lead_id) || 0,
                visa_preferences_count: visaCountsMap.get(summary.lead_id) || 0,
                user_preferences_summary: {
                    id: summary.id,
                    lead_id: summary.lead_id,
                    created_at: summary.created_at,
                    updated_at: summary.updated_at
                }
            }));

            return {
                leads,
                total_count: count || 0,
                page,
                limit,
                total_pages: Math.ceil((count || 0) / limit)
            };
        } catch (error) {
            console.error('Error in getAllLeadsBasicPaginated:', error);
            throw new Error(`Failed to get all leads basic: ${error instanceof Error ? error.message : 'Unknown error'}`);
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


            const leadIds = data.map(item => item.lead_id);


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
     * Get all leads with minimal details and service relationships
     */
    async getAllLeadsMinimal(params?: {
        page?: number;
        limit?: number;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }, roleFilter?: IRoleFilter): Promise<{
        leads: Array<{
            lead_id: string;
            itinerary_id: string;
            lead_details: {
                name: string;
                email: string;
                phone: string;
                status: string;
            };
            services: Array<{
                service_id: string;
                service_name: string;
                service_code: string;
                categories: Array<{
                    category_id: string;
                    category_name: string;
                    sub_services: Array<{
                        sub_service_id: string;
                        sub_service_name: string;
                    }>;
                }>;
            }>;
            summary: {
                flight_preferences_added: boolean;
                hotel_preferences_added: boolean;
                visa_preferences_added: boolean;
                last_updated: string;
                status: string;
            };
            created_at: string;
        }>;
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

            let query = supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select(`
                id,
                lead_id,
                flight_preferences_added,
                hotel_preferences_added,
                visa_preferences_added,
                last_updated,
                status,
                leads!inner(
                    id,
                    name,
                    email,
                    phone,
                    status,
                    created_at
                )
            `, { count: 'exact' })
                .order(sortBy, { ascending: sortOrder === 'asc' });


            if (roleFilter?.role === 'rm' && roleFilter?.userId) {
                query = query.eq('leads.assigned_to', roleFilter.userId);
            }

            const { data: summaries, error: summariesError, count } = await query
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

            const leadIds = summaries.map(summary => summary.lead_id);

            const { data: relationships, error: relError } = await supabaseAdmin
                .from('lead_service_relationships')
                .select(`
                lead_id,
                service:services!inner(
                    id,
                    name,
                    code
                ),
                category:sub_service_categories!inner(
                    id,
                    name
                ),
                sub_service:sub_services!inner(
                    id,
                    name
                )
            `)
                .in('lead_id', leadIds)
                .order('display_order', { ascending: true });

            if (relError) {
                console.warn('Error fetching service relationships:', relError.message);
            }

            const relationshipsByLead = new Map<string, Map<string, any>>();

            if (relationships) {
                relationships.forEach((rel: any) => {
                    const leadId = rel.lead_id;
                    const serviceId = rel.service.id;

                    if (!relationshipsByLead.has(leadId)) {
                        relationshipsByLead.set(leadId, new Map());
                    }

                    const serviceMap = relationshipsByLead.get(leadId)!;

                    if (!serviceMap.has(serviceId)) {
                        serviceMap.set(serviceId, {
                            service_id: serviceId,
                            service_name: rel.service.name,
                            service_code: rel.service.code,
                            categories: new Map()
                        });
                    }

                    const serviceData = serviceMap.get(serviceId)!;
                    const categoryId = rel.category.id;

                    if (!serviceData.categories.has(categoryId)) {
                        serviceData.categories.set(categoryId, {
                            category_id: categoryId,
                            category_name: rel.category.name,
                            sub_services: []
                        });
                    }

                    const categoryData = serviceData.categories.get(categoryId)!;
                    categoryData.sub_services.push({
                        sub_service_id: rel.sub_service.id,
                        sub_service_name: rel.sub_service.name
                    });
                });
            }


            const leads = summaries.map((summary: any) => {
                const leadId = summary.lead_id;
                const itineraryId = summary.id;
                const leadDetails = summary.leads;

                const services: any[] = [];

                if (relationshipsByLead.has(leadId)) {
                    const serviceMap = relationshipsByLead.get(leadId)!;

                    services.push(...Array.from(serviceMap.values()).map(service => ({
                        service_id: service.service_id,
                        service_name: service.service_name,
                        service_code: service.service_code,
                        categories: Array.from(service.categories.values()).map((cat: any) => ({
                            category_id: cat.category_id,
                            category_name: cat.category_name,
                            sub_services: cat.sub_services
                        }))
                    })));
                }

                return {
                    lead_id: leadId,
                    itinerary_id: itineraryId,
                    lead_details: {
                        name: leadDetails.name,
                        email: leadDetails.email,
                        phone: leadDetails.phone,
                        status: leadDetails.status,
                    },
                    services,
                    summary: {
                        flight_preferences_added: summary.flight_preferences_added,
                        hotel_preferences_added: summary.hotel_preferences_added,
                        visa_preferences_added: summary.visa_preferences_added,
                        last_updated: summary.last_updated,
                        status: summary.status
                    },
                    created_at: leadDetails.created_at
                };
            });

            return {
                leads,
                total_count: count || 0,
                page,
                limit,
                total_pages: Math.ceil((count || 0) / limit)
            };

        } catch (error) {
            console.error('Error in getAllLeadsMinimal:', error);
            throw new Error(
                `Failed to get minimal lead details: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    },

    /**
     * Transform frontend form data to database format for service_preferences table
     */
    transformFormDataToServicePreferences(formData: IFrontendFormData): {
        leadId: string;
        servicePreferences: Array<{
            service_type: string;
            service_code: string;
            preference_order: number;
            title?: string;
            description?: string;
            estimated_price?: number;
            currency?: string;
            preferences: Record<string, any>;
            is_active?: boolean;
            metadata?: Record<string, any>;
        }>;
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
    } {
        const { leadData, flightOptions = [], hotelOptions = [], visaOptions = [],
            transferOptions = [], groupBookingOptions = [], tourPackageOptions = [],
            aircraftCharterOptions = [], eventManagementOptions = [], yachtCharterOptions = [],
            userPreferences } = formData;

        const servicePreferences: Array<{
            service_type: string;
            service_code: string;
            preference_order: number;
            title?: string;
            description?: string;
            estimated_price?: number;
            currency?: string;
            preferences: Record<string, any>;
            is_active?: boolean;
            metadata?: Record<string, any>;
        }> = [];

        if (flightOptions.length > 0) {
            flightOptions.forEach((flight: any, index: number) => {
                // Build preferences object based on trip type
                let preferences: Record<string, any> = {
                    airline: flight.airline || '',
                    cabin_class: flight.cabinClass || '',
                    fare_type: flight.fareType || '',
                    estimated_price_per_person: flight.estimatedPricePerPerson ? parseFloat(flight.estimatedPricePerPerson) : 0,
                    currency: 'INR',
                    flexible_schedule: Boolean(flight.flexibleSchedule),
                    notes: ''
                };

                // Handle different trip types from payload
                if (flight.tripType === 'one-way') {
                    preferences = {
                        ...preferences,
                        trip_type: 'one-way',
                        departure_city: flight.departureCity || '',
                        arrival_city: flight.arrivalCity || '',
                        departure_date: flight.departureDate || '',
                        arrival_date: flight.arrivalDate || '',
                        route: `${flight.departureCity || ''} to ${flight.arrivalCity || ''}`
                    };
                }
                else if (flight.tripType === 'return') {
                    preferences = {
                        ...preferences,
                        trip_type: 'return',
                        departure_city: flight.departureCity || '',
                        arrival_city: flight.arrivalCity || '',
                        departure_date: flight.departureDate || '',
                        arrival_date: flight.arrivalDate || '',
                        return_departure_date: flight.returnDepartureDate || '',
                        return_arrival_date: flight.returnArrivalDate || '',
                        route: `${flight.departureCity || ''} to ${flight.arrivalCity || ''} (Return)`
                    };
                }
                else if (flight.tripType === 'multi-city') {
                    preferences = {
                        ...preferences,
                        trip_type: 'multi-city',
                        segments: flight.segments || [],
                        total_segments: flight.segments?.length || 0,
                        route: flight.segments?.map((s: any) => `${s.departureCity}→${s.arrivalCity}`).join(' | ') || ''
                    };
                }

                servicePreferences.push({
                    service_type: 'FLIGHTS',
                    service_code: 'FLIGHTS',
                    preference_order: index + 1,
                    title: `Flight Option ${index + 1}: ${flight.airline || 'Flight'} (${flight.tripType || 'one-way'})`,
                    description: flight.tripType === 'multi-city'
                        ? `Multi-city: ${flight.segments?.length || 0} segments`
                        : `${flight.departureCity || 'N/A'} to ${flight.arrivalCity || 'N/A'} | Cabin: ${flight.cabinClass || 'N/A'}`,
                    estimated_price: flight.estimatedPricePerPerson ? parseFloat(flight.estimatedPricePerPerson) : 0,
                    currency: 'INR',
                    preferences: preferences,
                    is_active: true,
                    metadata: {
                        source: 'frontend_form',
                        imported_at: new Date().toISOString(),
                        frontend_option_id: flight.id,
                        trip_type: flight.tripType || 'one-way'
                    }
                });
            });
        }

        // Hotel Service Preferences
        if (hotelOptions.length > 0) {
            hotelOptions.forEach((hotel: any, index: number) => {
                console.log(`Hotel Option ${index + 1}:`, {
                    checkInDate: hotel.checkInDate,
                    checkOutDate: hotel.checkOutDate,
                    hotelName: hotel.hotelName
                });
                servicePreferences.push({
                    service_type: 'HOTELS',
                    service_code: 'HOTELS',
                    preference_order: index + 1,
                    title: `Hotel Option ${index + 1}: ${hotel.hotelName || 'Hotel'}`,
                    description: `Category: ${hotel.hotelCategory || 'N/A'}, Room: ${hotel.roomType || 'N/A'}`,
                    estimated_price: hotel.estimatedTotalStayCost ? parseFloat(hotel.estimatedTotalStayCost) : 0,
                    currency: 'INR',
                    preferences: {
                        hotel_name: hotel.hotelName || '',
                        hotel_category: hotel.hotelCategory || '',
                        room_type: hotel.roomType || '',
                        stay_type: hotel.stayType || '',
                        meal_plan: hotel.mealPlan || '',
                        location: hotel.location || '',
                        better_location: hotel.betterLocation || '',
                        estimated_price_per_night: hotel.estimatedPricePerNight ? parseFloat(hotel.estimatedPricePerNight) : 0,
                        estimated_total_stay_cost: hotel.estimatedTotalStayCost ? parseFloat(hotel.estimatedTotalStayCost) : 0,
                        premium_amenities: hotel.premiumAmenities || '',
                        experience_highlights: hotel.experienceHighlights || '',
                        check_in_date: hotel.checkInDate || '',
                        check_out_date: hotel.checkOutDate || '',
                        notes: ''
                    },
                    is_active: true,
                    metadata: {
                        source: 'frontend_form',
                        imported_at: new Date().toISOString(),
                        frontend_option_id: hotel.id
                    }
                });
            });
        }

        // Visa Service Preferences
        if (visaOptions.length > 0) {
            visaOptions.forEach((visa: any, index: number) => {
                servicePreferences.push({
                    service_type: 'VISA_SERVICES',
                    service_code: 'VISA_SERVICES',
                    preference_order: index + 1,
                    title: `Visa Option ${index + 1}: ${visa.visaType || 'Visa'}`,
                    description: `Processing: ${visa.processingTime || 'N/A'}`,
                    estimated_price: visa.estimatedTotalCost ? parseFloat(visa.estimatedTotalCost) : 0,
                    currency: 'INR',
                    preferences: {
                        visa_type: visa.visaType || '',
                        processing_time: visa.processingTime || '',
                        estimated_total_cost: visa.estimatedTotalCost ? parseFloat(visa.estimatedTotalCost) : 0,
                        document_checklist: visa.documentChecklist || '',
                        special_requirements: visa.specialRequirements || '',
                        date: visa.date || '',
                        notes: ''
                    },
                    is_active: true,
                    metadata: {
                        source: 'frontend_form',
                        imported_at: new Date().toISOString(),
                        frontend_option_id: visa.id
                    }
                });
            });
        }

        // Transfer Service Preferences
        if (transferOptions && transferOptions.length > 0) {
            transferOptions.forEach((transfer: any, index: number) => {
                servicePreferences.push({
                    service_type: 'TRANSFERS',
                    service_code: 'TRANSFERS',
                    preference_order: index + 1,
                    title: `Transfer Option ${index + 1}: ${transfer.vehicleType || 'Transfer'}`,
                    description: `Type: ${transfer.transferType || 'N/A'}, Passengers: ${transfer.passengers || 'N/A'}`,
                    estimated_price: transfer.estimatedPrice ? parseFloat(transfer.estimatedPrice) : 0,
                    currency: 'INR',
                    preferences: {
                        vehicle_type: transfer.vehicleType || '',
                        transfer_type: transfer.transferType || '',
                        passengers: parseInt(transfer.passengers) || 0,
                        add_on_services: transfer.addOnServices || '',
                        pickup_location: transfer.pickupLocation || '',
                        drop_location: transfer.dropLocation || '',
                        transfer_date_time: transfer.transferDateTime || '',
                        estimated_price: transfer.estimatedPrice ? parseFloat(transfer.estimatedPrice) : 0,
                        special_requirements: transfer.specialRequirements || '',
                        notes: ''
                    },
                    is_active: true,
                    metadata: {
                        source: 'frontend_form',
                        imported_at: new Date().toISOString(),
                        frontend_option_id: transfer.id
                    }
                });
            });
        }

        // Group Booking Service Preferences
        if (groupBookingOptions && groupBookingOptions.length > 0) {
            groupBookingOptions.forEach((group: any, index: number) => {
                servicePreferences.push({
                    service_type: 'GROUP_BOOKINGS',
                    service_code: 'GROUP_BOOKINGS',
                    preference_order: index + 1,
                    title: `Group Booking Option ${index + 1}: ${group.groupType || 'Group'}`,
                    description: `Size: ${group.groupSize || 'N/A'}, Destination: ${group.destination || 'N/A'}`,
                    estimated_price: group.estimatedPricePerPerson ? parseFloat(group.estimatedPricePerPerson) : 0,
                    currency: 'INR',
                    preferences: {
                        group_size: parseInt(group.groupSize) || 0,
                        group_type: group.groupType || '',
                        destination: group.destination || '',
                        travel_date: group.travelDate || '',
                        return_date: group.returnDate || '',
                        estimated_price_per_person: group.estimatedPricePerPerson ? parseFloat(group.estimatedPricePerPerson) : 0,
                        special_requirements: group.specialRequirements || '',
                        notes: ''
                    },
                    is_active: true,
                    metadata: {
                        source: 'frontend_form',
                        imported_at: new Date().toISOString(),
                        frontend_option_id: group.id
                    }
                });
            });
        }

        // Tour Package Service Preferences
        if (tourPackageOptions && tourPackageOptions.length > 0) {
            tourPackageOptions.forEach((tour: any, index: number) => {
                servicePreferences.push({
                    service_type: 'TOUR_PACKAGES',
                    service_code: 'TOUR_PACKAGES',
                    preference_order: index + 1,
                    title: `Tour Package Option ${index + 1}: ${tour.tourType || 'Tour'}`,
                    description: `Duration: ${tour.duration || 'N/A'} days, Destination: ${tour.destination || 'N/A'}`,
                    estimated_price: tour.estimatedPricePerPerson ? parseFloat(tour.estimatedPricePerPerson) : 0,
                    currency: 'INR',
                    preferences: {
                        tour_type: tour.tourType || '',
                        duration: parseInt(tour.duration) || 0,
                        destination: tour.destination || '',
                        package_type: tour.packageType || '',
                        tour_start_date: tour.tourStartDate || '',
                        tour_end_date: tour.tourEndDate || '',
                        inclusions: tour.inclusions || '',
                        estimated_price_per_person: tour.estimatedPricePerPerson ? parseFloat(tour.estimatedPricePerPerson) : 0,
                        special_requirements: tour.specialRequirements || '',
                        notes: ''
                    },
                    is_active: true,
                    metadata: {
                        source: 'frontend_form',
                        imported_at: new Date().toISOString(),
                        frontend_option_id: tour.id
                    }
                });
            });
        }

        // Aircraft Charter Service Preferences
        if (aircraftCharterOptions && aircraftCharterOptions.length > 0) {
            aircraftCharterOptions.forEach((aircraft: any, index: number) => {
                servicePreferences.push({
                    service_type: 'CHARTER_SERVICES',
                    service_code: 'CHARTER_SERVICES',
                    preference_order: index + 1,
                    title: `Aircraft Charter Option ${index + 1}: ${aircraft.aircraftType || 'Aircraft'}`,
                    description: `Capacity: ${aircraft.passengerCapacity || 'N/A'}, Duration: ${aircraft.flightDuration || 'N/A'}`,
                    estimated_price: aircraft.estimatedPrice ? parseFloat(aircraft.estimatedPrice) : 0,
                    currency: 'INR',
                    preferences: {
                        aircraft_type: aircraft.aircraftType || '',
                        passenger_capacity: aircraft.passengerCapacity || '',
                        flight_duration: aircraft.flightDuration || '',
                        catering_services: aircraft.cateringServices || '',
                        departure_port: aircraft.departurePort || '',
                        arrival_port: aircraft.arrivalPort || '',
                        charter_start: aircraft.charterStart || '',
                        charter_end: aircraft.charterEnd || '',
                        guests: parseInt(aircraft.guests) || 0,
                        duration: parseInt(aircraft.duration) || 0,
                        estimated_price: aircraft.estimatedPrice ? parseFloat(aircraft.estimatedPrice) : 0,
                        special_requirements: aircraft.specialRequirements || '',
                        notes: ''
                    },
                    is_active: true,
                    metadata: {
                        source: 'frontend_form',
                        imported_at: new Date().toISOString(),
                        frontend_option_id: aircraft.id
                    }
                });
            });
        }

        // Event Management Service Preferences
        if (eventManagementOptions && eventManagementOptions.length > 0) {
            eventManagementOptions.forEach((event: any, index: number) => {
                servicePreferences.push({
                    service_type: 'EVENT_MANAGEMENT',
                    service_code: 'EVENT_MANAGEMENT',
                    preference_order: index + 1,
                    title: `Event Management Option ${index + 1}: ${event.eventType || 'Event'}`,
                    description: `Scale: ${event.eventScale || 'N/A'}, Attendees: ${event.attendees || 'N/A'}`,
                    estimated_price: event.estimatedPrice ? parseFloat(event.estimatedPrice) : 0,
                    currency: 'INR',
                    preferences: {
                        event_type: event.eventType || '',
                        event_scale: event.eventScale || '',
                        services_required: event.servicesRequired || '',
                        catering_entertainment: event.cateringEntertainment || '',
                        venue: event.venue || '',
                        budget: event.budget || '',
                        attendees: parseInt(event.attendees) || 0,
                        event_date: event.eventDate || '',
                        estimated_price: event.estimatedPrice ? parseFloat(event.estimatedPrice) : 0,
                        special_requirements: event.specialRequirements || '',
                        notes: ''
                    },
                    is_active: true,
                    metadata: {
                        source: 'frontend_form',
                        imported_at: new Date().toISOString(),
                        frontend_option_id: event.id
                    }
                });
            });
        }

        // Yacht Charter Service Preferences
        if (yachtCharterOptions && yachtCharterOptions.length > 0) {
            yachtCharterOptions.forEach((yacht: any, index: number) => {
                servicePreferences.push({
                    service_type: 'YACHT_CHARTER',
                    service_code: 'YACHT_CHARTER',
                    preference_order: index + 1,
                    title: `Yacht Charter Option ${index + 1}: ${yacht.yachtType || 'Yacht'}`,
                    description: `Duration: ${yacht.charterDuration || 'N/A'}, Guests: ${yacht.guests || 'N/A'}`,
                    estimated_price: yacht.estimatedPrice ? parseFloat(yacht.estimatedPrice) : 0,
                    currency: 'INR',
                    preferences: {
                        yacht_type: yacht.yachtType || '',
                        charter_duration: yacht.charterDuration || '',
                        crew_services: yacht.crewServices || '',
                        yacht_amenities: yacht.yachtAmenities || '',
                        departure_port: yacht.departurePort || '',
                        arrival_port: yacht.arrivalPort || '',
                        charter_start: yacht.charterStart || '',
                        charter_end: yacht.charterEnd || '',
                        guests: parseInt(yacht.guests) || 0,
                        duration: parseInt(yacht.duration) || 0,
                        estimated_price: yacht.estimatedPrice ? parseFloat(yacht.estimatedPrice) : 0,
                        special_requirements: yacht.specialRequirements || '',
                        notes: ''
                    },
                    is_active: true,
                    metadata: {
                        source: 'frontend_form',
                        imported_at: new Date().toISOString(),
                        frontend_option_id: yacht.id
                    }
                });
            });
        }

        return {
            leadId: leadData.id,
            servicePreferences,
            userPreferences: {
                flightPreferencesAdded: userPreferences.flightPreferencesAdded || false,
                hotelPreferencesAdded: userPreferences.hotelPreferencesAdded || false,
                visaPreferencesAdded: userPreferences.visaPreferencesAdded || false,
                transferPreferencesAdded: userPreferences.transferPreferencesAdded || false,
                groupBookingPreferencesAdded: userPreferences.groupBookingPreferencesAdded || false,
                tourPackagePreferencesAdded: userPreferences.tourPackagePreferencesAdded || false,
                aircraftCharterPreferencesAdded: userPreferences.aircraftCharterPreferencesAdded || false,
                eventManagementPreferencesAdded: userPreferences.eventManagementPreferencesAdded || false,
                yachtCharterPreferencesAdded: userPreferences.yachtCharterPreferencesAdded || false,
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
  * Save all service preferences to service_preferences table
  */
    async saveAllServicePreferences(data: {
        leadId: string;
        servicePreferences: Array<{
            service_type: string;
            service_code: string;
            preference_order: number;
            title?: string;
            description?: string;
            estimated_price?: number;
            currency?: string;
            preferences: Record<string, any>;
            is_active?: boolean;
            metadata?: Record<string, any>;
        }>;
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
    }): Promise<{
        lead_id: string;
        itinerary_id: string;
        service_preferences: any[];
        user_preferences_summary: any;
        lead_details?: ILeadDetails;
    }> {
        const { leadId, servicePreferences, userPreferences } = data;

        try {
            // Calculate service counts and added services
            const serviceCounts: Record<string, number> = {};
            const servicesAdded: Record<string, boolean> = {};

            servicePreferences.forEach(pref => {
                const serviceType = pref.service_type;
                if (!serviceCounts[serviceType]) {
                    serviceCounts[serviceType] = 0;
                    servicesAdded[serviceType] = true;
                }
                serviceCounts[serviceType]++;
            });

            // Check if we should create a new version or update existing
            // Check metadata for createNewVersion flag (default to false to maintain existing behavior)
            const createNewVersion = userPreferences.metadata?.createNewVersion === true;

            let userPrefsData: any;
            let itineraryId: string = ''; // Initialize with empty string
            let createNewVersionFallback = false;

            if (!createNewVersion) {
                // Try to find existing active itinerary for this lead
                const { data: existingSummary, error: checkError } = await supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .select('id, status, version_number')
                    .eq('lead_id', leadId)
                    .in('status', ['Itinerary_Created', 'Itinerary_send', 'Itinerary_Updated'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (existingSummary && !checkError) {
                    // Update existing itinerary instead of creating new one
                    itineraryId = existingSummary.id;

                    // Get current version number
                    const currentVersion = existingSummary.version_number || 1;

                    // Update the existing summary
                    const updateFields: any = {
                        flight_preferences_added: userPreferences.flightPreferencesAdded,
                        hotel_preferences_added: userPreferences.hotelPreferencesAdded,
                        visa_preferences_added: userPreferences.visaPreferencesAdded,
                        transfer_preferences_added: userPreferences.transferPreferencesAdded,
                        group_booking_preferences_added: userPreferences.groupBookingPreferencesAdded,
                        tour_package_preferences_added: userPreferences.tourPackagePreferencesAdded,
                        aircraft_charter_preferences_added: userPreferences.aircraftCharterPreferencesAdded,
                        event_management_preferences_added: userPreferences.eventManagementPreferencesAdded,
                        yacht_charter_preferences_added: userPreferences.yachtCharterPreferencesAdded,
                        last_updated: userPreferences.lastUpdated || new Date().toISOString(),
                        metadata: {
                            ...userPreferences.metadata,
                            service_counts: serviceCounts,
                            total_service_options: servicePreferences.length,
                            previous_version: currentVersion,
                            updated_at: new Date().toISOString()
                        },
                        services_added: servicesAdded,
                        service_counts: serviceCounts,
                        updated_at: new Date().toISOString(),
                        status: 'Itinerary_Updated'
                    };

                    const { data: updatedData, error: updateError } = await supabaseAdmin
                        .from('user_itenary_preferences_summary')
                        .update(updateFields)
                        .eq('id', itineraryId)
                        .select()
                        .single();

                    if (updateError) {
                        console.error('Error updating existing itinerary:', updateError);
                        // If update fails, fall back to creating new
                        createNewVersionFallback = true;
                        userPrefsData = null; // Reset to trigger new creation
                        itineraryId = ''; // Reset itineraryId
                    } else {
                        userPrefsData = updatedData;

                        // Delete old preferences for this itinerary
                        await Promise.all([
                            supabaseAdmin.from('service_preferences').delete().eq('itinerary_id', itineraryId),
                            supabaseAdmin.from('flight_preferences').delete().eq('itinerary_id', itineraryId),
                            supabaseAdmin.from('hotel_preferences').delete().eq('itinerary_id', itineraryId)
                        ]);
                    }
                }
            }

            // Create new itinerary if no existing found or update failed or createNewVersion flag is true
            if (!userPrefsData || createNewVersion || createNewVersionFallback) {
                // Get the latest version number for this lead
                const { data: latestSummary } = await supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .select('version_number')
                    .eq('lead_id', leadId)
                    .order('version_number', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const newVersion = (latestSummary?.version_number || 0) + 1;

                // Create new user preferences summary
                const userPrefsSummary: any = {
                    lead_id: leadId,
                    type: 'form',
                    flight_preferences_added: userPreferences.flightPreferencesAdded,
                    hotel_preferences_added: userPreferences.hotelPreferencesAdded,
                    visa_preferences_added: userPreferences.visaPreferencesAdded,
                    transfer_preferences_added: userPreferences.transferPreferencesAdded,
                    group_booking_preferences_added: userPreferences.groupBookingPreferencesAdded,
                    tour_package_preferences_added: userPreferences.tourPackagePreferencesAdded,
                    aircraft_charter_preferences_added: userPreferences.aircraftCharterPreferencesAdded,
                    event_management_preferences_added: userPreferences.eventManagementPreferencesAdded,
                    yacht_charter_preferences_added: userPreferences.yachtCharterPreferencesAdded,
                    last_updated: userPreferences.lastUpdated || new Date().toISOString(),
                    metadata: {
                        ...userPreferences.metadata,
                        service_counts: serviceCounts,
                        total_service_options: servicePreferences.length,
                        version: newVersion,
                        created_at: new Date().toISOString()
                    },
                    services_added: servicesAdded,
                    service_counts: serviceCounts,
                    version_number: newVersion,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    status: 'Itinerary_Created'
                };

                const { data: newData, error: userPrefsError } = await supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .insert(userPrefsSummary)
                    .select()
                    .single();

                if (userPrefsError) {
                    throw new Error(`Failed to save user preferences summary: ${userPrefsError.message}`);
                }

                userPrefsData = newData;
                itineraryId = userPrefsData.id;
            }

            // Save to flight_preferences table
            const flightPreferencesData = servicePreferences
                .filter(sp => sp.service_type === 'FLIGHTS')
                .map((sp, index) => ({
                    lead_id: leadId,
                    itinerary_id: itineraryId,
                    preference_order: sp.preference_order,
                    airline: sp.preferences.airline,
                    service_code: sp.service_code || sp.service_type,
                    trip_type: sp.preferences.trip_type,
                    departure_city: sp.preferences.departure_city,
                    arrival_city: sp.preferences.arrival_city,
                    departure_date: sp.preferences.departure_date,
                    arrival_date: sp.preferences.arrival_date,
                    return_departure_date: sp.preferences.return_departure_date,
                    return_arrival_date: sp.preferences.return_arrival_date,
                    segments: sp.preferences.segments || [],
                    cabin_class: sp.preferences.cabin_class,
                    fare_type: sp.preferences.fare_type,
                    estimated_price_per_person: sp.preferences.estimated_price_per_person,
                    estimated_total_price: sp.preferences.estimated_price_per_person,
                    currency: sp.preferences.currency || 'INR',
                    status: 'draft',
                    flexible_schedule: sp.preferences.flexible_schedule || false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

            if (flightPreferencesData.length > 0) {
                const { error: flightError } = await supabaseAdmin
                    .from('flight_preferences')
                    .insert(flightPreferencesData);

                if (flightError) {
                    console.error('Failed to save to flight_preferences:', flightError.message);
                }
            }

            // Save to hotel_preferences table
            const hotelPreferencesData = servicePreferences
                .filter(sp => sp.service_type === 'HOTELS')
                .map((sp, index) => ({
                    lead_id: leadId,
                    itinerary_id: itineraryId,
                    preference_order: sp.preference_order,
                    hotel_name: sp.preferences.hotel_name,
                    hotel_category: sp.preferences.hotel_category,
                    room_type: sp.preferences.room_type,
                    stay_type: sp.preferences.stay_type,
                    meal_plan: sp.preferences.meal_plan,
                    location: sp.preferences.location,
                    better_location: sp.preferences.better_location,
                    premium_amenities: sp.preferences.premium_amenities,
                    experience_highlights: sp.preferences.experience_highlights,
                    check_in_date: sp.preferences.check_in_date,
                    check_out_date: sp.preferences.check_out_date,
                    estimated_price_per_night: sp.preferences.estimated_price_per_night,
                    estimated_total_stay_cost: sp.preferences.estimated_total_stay_cost,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

            if (hotelPreferencesData.length > 0) {
                console.log('🏨 Attempting to insert hotel data:', JSON.stringify(hotelPreferencesData, null, 2));

                const { data: insertedHotelData, error: hotelError } = await supabaseAdmin
                    .from('hotel_preferences')
                    .insert(hotelPreferencesData)
                    .select();

                if (hotelError) {
                    console.error('❌ Hotel insert error details:', {
                        message: hotelError.message,
                        details: hotelError.details,
                        hint: hotelError.hint,
                        code: hotelError.code
                    });
                } else {
                    console.log('✅ Hotel preferences saved successfully:', insertedHotelData);
                }
            }

            // Insert service preferences with the itinerary_id
            let savedServicePreferences: any[] = [];
            if (servicePreferences.length > 0) {
                const servicePrefsToInsert = servicePreferences.map((pref, index) => ({
                    ...pref,
                    lead_id: leadId,
                    itinerary_id: itineraryId,
                    preference_order: pref.preference_order || index + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const { data: serviceData, error: serviceError } = await supabaseAdmin
                    .from('service_preferences')
                    .insert(servicePrefsToInsert)
                    .select();

                if (serviceError) {
                    throw new Error(`Failed to save service preferences: ${serviceError.message}`);
                }
                savedServicePreferences = serviceData || [];
            }

            // Fetch lead details
            let leadDetailsResult: ILeadDetails | undefined;
            try {
                const { data: detailsData } = await supabaseAdmin
                    .from('leads')
                    .select('*')
                    .eq('id', leadId)
                    .single();

                leadDetailsResult = detailsData as ILeadDetails;

                // Update lead stage if needed
                if (leadDetailsResult && leadDetailsResult.stage !== 'Itinerary Generated') {
                    await supabaseAdmin
                        .from('leads')
                        .update({
                            stage: 'Itinerary Generated',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', leadId);

                    leadDetailsResult.stage = 'Itinerary Generated';
                }
            } catch (error) {
                console.warn('Could not fetch lead details:', error);
            }

            return {
                lead_id: leadId,
                itinerary_id: itineraryId,
                service_preferences: savedServicePreferences,
                user_preferences_summary: userPrefsData,
                lead_details: leadDetailsResult
            };

        } catch (error) {
            console.error('Error in saveAllServicePreferences:', error);
            throw new Error(`Failed to save service preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    async updateItineraryStatus(leadId: string, id: string, status: string) {
        const { data, error } = await supabaseAdmin
            .from('user_itenary_preferences_summary')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('lead_id', leadId)
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to update itinerary status: ${error.message}`);
        }

        return data;
    },
};
