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

            // if (exists.data) {
            //     throw new Error(`Cannot create: preferences already exist for lead ${leadId}. Use update instead.`);
            // }

            // Clear existing data
            // await this.deleteByLeadId(leadId);

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
    async updatePreferences(
        leadId: string,
        updateData: any,
        itineraryId?: string,
    ): Promise<IItineraryPreferencesResponse> {
        try {
            console.log("The update data we get", JSON.stringify(updateData, null, 2));

            // First, check if an itinerary exists for this lead
            const { data: existingItinerary, error: itineraryCheckError } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('id')
                .eq('lead_id', leadId)
                .single();

            if (itineraryCheckError && itineraryCheckError.code !== 'PGRST116') {
                // PGRST116 means no rows found - that's okay
                throw new Error(`Failed to check existing itinerary: ${itineraryCheckError.message}`);
            }

            // If we have an itineraryId parameter, use it to verify
            if (itineraryId) {
                // Verify that the itinerary exists and belongs to this lead
                const { data: itinerary, error: verifyError } = await supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .select('id')
                    .eq('id', itineraryId)
                    .eq('lead_id', leadId)
                    .single();

                if (verifyError || !itinerary) {
                    throw new Error(`Itinerary ${itineraryId} not found for lead ${leadId}`);
                }
            }

            // Update user preferences summary
            if (updateData.userPreferences) {
                const userPrefsUpdate = {
                    flight_preferences_added: updateData.userPreferences.flightPreferencesAdded,
                    hotel_preferences_added: updateData.userPreferences.hotelPreferencesAdded,
                    visa_preferences_added: updateData.userPreferences.visaPreferencesAdded,
                    transfer_preferences_added: updateData.userPreferences.transferPreferencesAdded,
                    group_booking_preferences_added: updateData.userPreferences.groupBookingPreferencesAdded,
                    tour_package_preferences_added: updateData.userPreferences.tourPackagePreferencesAdded,
                    aircraft_charter_preferences_added: updateData.userPreferences.aircraftCharterPreferencesAdded,
                    event_management_preferences_added: updateData.userPreferences.eventManagementPreferencesAdded,
                    yacht_charter_preferences_added: updateData.userPreferences.yachtCharterPreferencesAdded,
                    last_updated: updateData.userPreferences.lastUpdated || new Date().toISOString(),
                    metadata: updateData.userPreferences.metadata || {},
                    updated_at: new Date().toISOString()
                };

                // Check if summary exists
                const { data: existingSummary, error: summaryCheckError } = await supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .select('lead_id')
                    .eq('lead_id', leadId)
                    .single();

                if (summaryCheckError && summaryCheckError.code !== 'PGRST116') {
                    throw new Error(`Failed to check existing summary: ${summaryCheckError.message}`);
                }

                if (existingSummary) {
                    // Update existing
                    const { error } = await supabaseAdmin
                        .from('user_itenary_preferences_summary')
                        .update(userPrefsUpdate)
                        .eq('lead_id', leadId);

                    if (error) throw new Error(`Failed to update user preferences: ${error.message}`);
                } else {
                    // Create new
                    const { error } = await supabaseAdmin
                        .from('user_itenary_preferences_summary')
                        .insert({
                            ...userPrefsUpdate,
                            lead_id: leadId,
                            created_at: new Date().toISOString()
                        });

                    if (error) throw new Error(`Failed to create user preferences: ${error.message}`);
                }
            }

            // Update flight preferences (delete and recreate)
            if (updateData.flightPreferences !== undefined) {
                await supabaseAdmin
                    .from('flight_preferences')
                    .delete()
                    .eq('lead_id', leadId);

                if (updateData.flightPreferences && Array.isArray(updateData.flightPreferences) && updateData.flightPreferences.length > 0) {
                    const flightPrefsToInsert = updateData.flightPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
                        itinerary_id: itineraryId || null,
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

            // Update hotel preferences
            if (updateData.hotelPreferences !== undefined) {
                await supabaseAdmin
                    .from('hotel_preferences')
                    .delete()
                    .eq('lead_id', leadId);

                if (updateData.hotelPreferences && Array.isArray(updateData.hotelPreferences) && updateData.hotelPreferences.length > 0) {
                    const hotelPrefsToInsert = updateData.hotelPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
                        itinerary_id: itineraryId || null,
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

            // Update visa preferences
            if (updateData.visaPreferences !== undefined) {
                await supabaseAdmin
                    .from('visa_preferences')
                    .delete()
                    .eq('lead_id', leadId);

                if (updateData.visaPreferences && Array.isArray(updateData.visaPreferences) && updateData.visaPreferences.length > 0) {
                    const visaPrefsToInsert = updateData.visaPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
                        itinerary_id: itineraryId || null,
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

            // Update transfer preferences
            if (updateData.transferPreferences !== undefined) {
                await supabaseAdmin
                    .from('transfer_preferences')
                    .delete()
                    .eq('lead_id', leadId);

                if (updateData.transferPreferences && Array.isArray(updateData.transferPreferences) && updateData.transferPreferences.length > 0) {
                    const transferPrefsToInsert = updateData.transferPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
                        itinerary_id: itineraryId || null,
                        preference_order: index + 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));

                    const { error } = await supabaseAdmin
                        .from('transfer_preferences')
                        .insert(transferPrefsToInsert);

                    if (error) throw new Error(`Failed to update transfer preferences: ${error.message}`);
                }
            }

            // Update group booking preferences
            if (updateData.groupBookingPreferences !== undefined) {
                await supabaseAdmin
                    .from('group_booking_preferences')
                    .delete()
                    .eq('lead_id', leadId);

                if (updateData.groupBookingPreferences && Array.isArray(updateData.groupBookingPreferences) && updateData.groupBookingPreferences.length > 0) {
                    const groupPrefsToInsert = updateData.groupBookingPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
                        itinerary_id: itineraryId || null,
                        preference_order: index + 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));

                    const { error } = await supabaseAdmin
                        .from('group_booking_preferences')
                        .insert(groupPrefsToInsert);

                    if (error) throw new Error(`Failed to update group booking preferences: ${error.message}`);
                }
            }

            // Update tour package preferences
            if (updateData.tourPackagePreferences !== undefined) {
                await supabaseAdmin
                    .from('tour_package_preferences')
                    .delete()
                    .eq('lead_id', leadId);

                if (updateData.tourPackagePreferences && Array.isArray(updateData.tourPackagePreferences) && updateData.tourPackagePreferences.length > 0) {
                    const tourPrefsToInsert = updateData.tourPackagePreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
                        itinerary_id: itineraryId || null,
                        preference_order: index + 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));

                    const { error } = await supabaseAdmin
                        .from('tour_package_preferences')
                        .insert(tourPrefsToInsert);

                    if (error) throw new Error(`Failed to update tour package preferences: ${error.message}`);
                }
            }

            // Update aircraft charter preferences
            if (updateData.aircraftCharterPreferences !== undefined) {
                await supabaseAdmin
                    .from('aircraft_charter_preferences')
                    .delete()
                    .eq('lead_id', leadId);

                if (updateData.aircraftCharterPreferences && Array.isArray(updateData.aircraftCharterPreferences) && updateData.aircraftCharterPreferences.length > 0) {
                    const aircraftPrefsToInsert = updateData.aircraftCharterPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
                        itinerary_id: itineraryId || null,
                        preference_order: index + 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));

                    const { error } = await supabaseAdmin
                        .from('aircraft_charter_preferences')
                        .insert(aircraftPrefsToInsert);

                    if (error) throw new Error(`Failed to update aircraft charter preferences: ${error.message}`);
                }
            }

            // Update event management preferences
            if (updateData.eventManagementPreferences !== undefined) {
                await supabaseAdmin
                    .from('event_management_preferences')
                    .delete()
                    .eq('lead_id', leadId);

                if (updateData.eventManagementPreferences && Array.isArray(updateData.eventManagementPreferences) && updateData.eventManagementPreferences.length > 0) {
                    const eventPrefsToInsert = updateData.eventManagementPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
                        itinerary_id: itineraryId || null,
                        preference_order: index + 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));

                    const { error } = await supabaseAdmin
                        .from('event_management_preferences')
                        .insert(eventPrefsToInsert);

                    if (error) throw new Error(`Failed to update event management preferences: ${error.message}`);
                }
            }

            // Update yacht charter preferences
            if (updateData.yachtCharterPreferences !== undefined) {
                await supabaseAdmin
                    .from('yacht_charter_preferences')
                    .delete()
                    .eq('lead_id', leadId);

                if (updateData.yachtCharterPreferences && Array.isArray(updateData.yachtCharterPreferences) && updateData.yachtCharterPreferences.length > 0) {
                    const yachtPrefsToInsert = updateData.yachtCharterPreferences.map((pref: any, index: number) => ({
                        ...pref,
                        lead_id: leadId,
                        itinerary_id: itineraryId || null,
                        preference_order: index + 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }));

                    const { error } = await supabaseAdmin
                        .from('yacht_charter_preferences')
                        .insert(yachtPrefsToInsert);

                    if (error) throw new Error(`Failed to update yacht charter preferences: ${error.message}`);
                }
            }

            // Also update the main itinerary table if needed
            if (updateData.itineraryData && itineraryId) {
                const { error: itineraryUpdateError } = await supabaseAdmin
                    .from('user_itenary_preferences')
                    .update({
                        updated_at: new Date().toISOString(),
                        metadata: updateData.itineraryData.metadata || {}
                    })
                    .eq('id', itineraryId)
                    .eq('lead_id', leadId);

                if (itineraryUpdateError) {
                    throw new Error(`Failed to update itinerary: ${itineraryUpdateError.message}`);
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

        // Flight Service Preferences
        if (flightOptions.length > 0) {
            flightOptions.forEach((flight: any, index: number) => {
                servicePreferences.push({
                    service_type: 'FLIGHTS',
                    service_code: 'FLIGHTS',
                    preference_order: index + 1,
                    title: `Flight Option ${index + 1}: ${flight.airline || 'Flight'}`,
                    description: `Route: ${flight.route || 'N/A'}, Cabin: ${flight.cabinClass || 'N/A'}`,
                    estimated_price: flight.estimatedPricePerPerson ? parseFloat(flight.estimatedPricePerPerson) : 0,
                    currency: 'INR',
                    preferences: {
                        airline: flight.airline || '',
                        route: flight.route || '',
                        stops: flight.stops || '',
                        cabin_class: flight.cabinClass || '',
                        estimated_price_per_person: flight.estimatedPricePerPerson ? parseFloat(flight.estimatedPricePerPerson) : 0,
                        departure_arrival_time: flight.departureArrivalTime || '',
                        fare_type: flight.fareType || '',
                        preferred_time_slot: flight.preferredTimeSlot || '',
                        better_connection_duration: flight.betterConnectionDuration || '',
                        flexible_schedule: Boolean(flight.flexibleSchedule),
                        date: flight.date || '',
                        notes: ''
                    },
                    is_active: true,
                    metadata: {
                        source: 'frontend_form',
                        imported_at: new Date().toISOString(),
                        frontend_option_id: flight.id
                    }
                });
            });
        }

        // Hotel Service Preferences
        if (hotelOptions.length > 0) {
            hotelOptions.forEach((hotel: any, index: number) => {
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
                        date: hotel.date || '',
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
        service_preferences: any[];
        user_preferences_summary: any;
        lead_details?: ILeadDetails;
    }> {
        const { leadId, servicePreferences, userPreferences } = data;

        try {
            // Check if preferences already exist
            const exists = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('id')
                .eq('lead_id', leadId)
                .maybeSingle();

            // if (exists.data) {
            //     throw new Error(`Cannot create: preferences already exist for lead ${leadId}. Use update instead.`);
            // }

            // Clear existing service preferences
            // await supabaseAdmin
            //     .from('service_preferences')
            //     .delete()
            //     .eq('lead_id', leadId);

            // Save service preferences
            let savedServicePreferences: any[] = [];
            if (servicePreferences.length > 0) {
                const servicePrefsToInsert = servicePreferences.map(pref => ({
                    ...pref,
                    lead_id: leadId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));

                const { data: serviceData, error: serviceError } = await supabaseAdmin
                    .from('service_preferences')
                    .insert(servicePrefsToInsert)
                    .select();

                if (serviceError) throw new Error(`Failed to save service preferences: ${serviceError.message}`);
                savedServicePreferences = serviceData || [];
            }

            // Save user preferences summary with service counts
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

            const userPrefsSummary: any = {
                lead_id: leadId,
                flight_preferences_added: userPreferences.flightPreferencesAdded,
                hotel_preferences_added: userPreferences.hotelPreferencesAdded,
                visa_preferences_added: userPreferences.visaPreferencesAdded,
                last_updated: userPreferences.lastUpdated || new Date().toISOString(),
                metadata: {
                    ...userPreferences.metadata,
                    service_counts: serviceCounts,
                    total_service_options: servicePreferences.length
                },
                services_added: servicesAdded,
                service_counts: serviceCounts,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: userPrefsData, error: userPrefsError } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .insert(userPrefsSummary)
                .select()
                .single();

            if (userPrefsError) throw new Error(`Failed to save user preferences summary: ${userPrefsError.message}`);

            // Fetch lead details
            let leadDetailsResult: ILeadDetails | undefined;
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

            return {
                lead_id: leadId,
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
