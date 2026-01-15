import { itineraryPreferencesRepository } from '../repositories/itinerary-preferences.repository';
import {
    ICombinedPreferenceData,
    IItineraryPreferencesResponse,
    IUpdatePreferenceData,
    IFrontendFormData,
    IUserPreferencesSummary,
    IVisaPreference,
    IHotelPreference,
    IFlightPreference
} from '../interfaces/itinerary-preferences.interface';

import {
    validateFormData,
    calculateFormStats,
    generatePreferencesSummary,
    formatFormDataForDisplay
} from "../helpers";

export const itineraryPreferencesService = {


    /**
     * Get all preferences for an itinerary WITH SUMMARY
     */
    async getPreferencesWithSummary(itineraryId: string): Promise<{
        success: boolean;
        data?: IItineraryPreferencesResponse;
        summary?: any;
        message?: string;
    }> {
        try {
            const data = await itineraryPreferencesRepository.getByItineraryId(itineraryId);

            // Generate summary using helper function
            const combinedData: ICombinedPreferenceData = {
                itineraryId,
                flightPreferences: data.flight_preferences.map(fp => ({
                    preference_order: fp.preference_order,
                    airline: fp.airline,
                    route: fp.route,
                    stops: fp.stops,
                    cabin_class: fp.cabin_class,
                    estimated_price_per_person: fp.estimated_price_per_person,
                    departure_arrival_time: fp.departure_arrival_time,
                    fare_type: fp.fare_type,
                    preferred_time_slot: fp.preferred_time_slot,
                    better_connection_duration: fp.better_connection_duration,
                    flexible_schedule: fp.flexible_schedule,
                    notes: fp.notes
                })),
                hotelPreferences: data.hotel_preferences.map(hp => ({
                    preference_order: hp.preference_order,
                    hotel_category: hp.hotel_category,
                    meal_plan: hp.meal_plan,
                    estimated_price_per_night: hp.estimated_price_per_night,
                    estimated_total_stay_cost: hp.estimated_total_stay_cost,
                    stay_type: hp.stay_type,
                    location: hp.location,
                    room_type: hp.room_type,
                    better_location: hp.better_location,
                    premium_amenities: hp.premium_amenities,
                    experience_highlights: hp.experience_highlights,
                    notes: hp.notes
                })),
                visaPreferences: data.visa_preferences.map(vp => ({
                    preference_order: vp.preference_order,
                    visa_type: vp.visa_type,
                    processing_time: vp.processing_time,
                    estimated_total_cost: vp.estimated_total_cost,
                    document_checklist: vp.document_checklist,
                    special_requirements: vp.special_requirements,
                    notes: vp.notes
                })),
                userPreferences: {
                    flightPreferencesAdded: data.user_preferences_summary?.flight_preferences_added || false,
                    hotelPreferencesAdded: data.user_preferences_summary?.hotel_preferences_added || false,
                    visaPreferencesAdded: data.user_preferences_summary?.visa_preferences_added || false,
                    lastUpdated: data.user_preferences_summary?.last_updated || new Date().toISOString(),
                    metadata: data.user_preferences_summary?.metadata || {}
                }
            };

            const summary = generatePreferencesSummary(combinedData);

            return {
                success: true,
                data,
                summary
            };
        } catch (error) {
            console.error('Error getting itinerary preferences:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get preferences'
            };
        }
    },

    /**
     * Get all preferences for an itinerary
     */
    async getPreferences(itineraryId: string): Promise<{
        success: boolean;
        data?: IItineraryPreferencesResponse;
        message?: string;
    }> {
        try {
            const data = await itineraryPreferencesRepository.getByItineraryId(itineraryId);
            // console.log("&&&&&&&&&&&&&&&&\nThe data we get in service", data);
            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error getting itinerary preferences:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get preferences'
            };
        }
    },

    /**
     * Save preferences from frontend form data
     */
    async savePreferences(formData: IFrontendFormData): Promise<{
        success: boolean;
        data?: IItineraryPreferencesResponse;
        validation?: any;
        message?: string;
    }> {
        try {
            // Use validateFormData BEFORE processing
            const validation = validateFormData(formData);

            if (!validation.isValid) {
                return {
                    success: false,
                    validation,
                    message: `Validation failed: ${validation.errors.join(', ')}`
                };
            }

            // Log validation warnings if any
            if (validation.warnings.length > 0) {
                console.warn('Form validation warnings:', validation.warnings);
            }

            if (!formData.itineraryData?.id) {
                return {
                    success: false,
                    validation,
                    message: 'Itinerary ID is required'
                };
            }

            // Calculate and log statistics BEFORE saving
            const stats = calculateFormStats(formData);
            console.log('📊 Form statistics before saving:', stats);

            // Format for display/debugging
            const formattedData = formatFormDataForDisplay(formData);
            console.log('📋 Formatted data:', formattedData);

            const preferenceData = itineraryPreferencesRepository.transformFormData(formData);

            // Generate summary before saving
            const summary = generatePreferencesSummary(preferenceData);
            console.log('📝 Preferences summary:', summary.summary);

            const data = await itineraryPreferencesRepository.saveAllPreferences(preferenceData);

            // Add stats to response metadata
            if (data.user_preferences_summary) {
                data.user_preferences_summary.metadata = {
                    ...data.user_preferences_summary.metadata,
                    validation_stats: stats,
                    validation_warnings: validation.warnings,
                    summary: summary.details
                };
            }

            return {
                success: true,
                data,
                validation: {
                    ...validation,
                    stats,
                    summary: summary.summary
                }
            };
        } catch (error) {
            console.error('Error saving itinerary preferences:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to save preferences'
            };
        }
    },

    /**
     * Update specific preferences
     */
    async updatePreferences(itineraryId: string, updateData: IUpdatePreferenceData): Promise<{
        success: boolean;
        data?: IItineraryPreferencesResponse;
        message?: string;
    }> {
        try {

            if (!itineraryId) {
                return {
                    success: false,
                    message: 'Itinerary ID is required'
                };
            }

            const data = await itineraryPreferencesRepository.updatePreferences(itineraryId, updateData);
            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error updating itinerary preferences:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update preferences'
            };
        }
    },

    /**
     * Delete all preferences for an itinerary
     */
    async deletePreferences(itineraryId: string): Promise<{
        success: boolean;
        message?: string;
    }> {
        try {
            await itineraryPreferencesRepository.deleteByItineraryId(itineraryId);
            return {
                success: true,
                message: 'Preferences deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting itinerary preferences:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delete preferences'
            };
        }
    },

    /**
     * Check if itinerary has preferences
     */
    async checkPreferencesExist(itineraryId: string): Promise<{
        success: boolean;
        exists: boolean;
        message?: string;
    }> {
        try {
            const exists = await itineraryPreferencesRepository.hasPreferences(itineraryId);
            return {
                success: true,
                exists
            };
        } catch (error) {
            console.error('Error checking preferences:', error);
            return {
                success: false,
                exists: false,
                message: error instanceof Error ? error.message : 'Failed to check preferences'
            };
        }
    },

    /**
     * Save or update preferences (upsert operation)
     */
    async saveOrUpdatePreferences(formData: IFrontendFormData): Promise<{
        success: boolean;
        data?: IItineraryPreferencesResponse;
        validation?: any;
        message?: string;
        action: 'created' | 'updated';
    }> {
        try {

            const validation = validateFormData(formData);

            if (!validation.isValid) {
                return {
                    success: false,
                    validation,
                    message: `Validation failed: ${validation.errors.join(', ')}`,
                    action: 'created'
                };
            }

            if (!formData.itineraryData?.id) {
                return {
                    success: false,
                    validation,
                    message: 'Itinerary ID is required',
                    action: 'created'
                };
            }

            const itineraryId = formData.itineraryData.id;


            const stats = calculateFormStats(formData);
            console.log('📊 Form statistics:', stats);


            const formattedData = formatFormDataForDisplay(formData);
            console.log('📋 Form data formatted:', formattedData);

            const { exists } = await this.checkPreferencesExist(itineraryId);

            const preferenceData = itineraryPreferencesRepository.transformFormData(formData);


            const summary = generatePreferencesSummary(preferenceData);
            console.log('📝 Summary:', summary.summary);

            let data: IItineraryPreferencesResponse;
            if (exists) {
                data = await itineraryPreferencesRepository.updatePreferences(itineraryId, {
                    flightPreferences: preferenceData.flightPreferences,
                    hotelPreferences: preferenceData.hotelPreferences,
                    visaPreferences: preferenceData.visaPreferences,
                    userPreferences: {
                        ...preferenceData.userPreferences,
                        metadata: {
                            ...preferenceData.userPreferences.metadata,
                            validation_stats: stats,
                            validation_warnings: validation.warnings,
                            summary: summary.details
                        }
                    }
                });
            } else {
                data = await itineraryPreferencesRepository.saveAllPreferences({
                    ...preferenceData,
                    userPreferences: {
                        ...preferenceData.userPreferences,
                        metadata: {
                            ...preferenceData.userPreferences.metadata,
                            validation_stats: stats,
                            validation_warnings: validation.warnings,
                            summary: summary.details
                        }
                    }
                });
            }

            return {
                success: true,
                data,
                validation: {
                    ...validation,
                    stats,
                    summary: summary.summary
                },
                action: exists ? 'updated' : 'created'
            };
        } catch (error) {
            console.error('Error in saveOrUpdatePreferences:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to save/update preferences',
                action: 'created'
            };
        }
    },

    /**
     * Get flight preference by ID
     */
    async getFlightPreferenceById(id: string): Promise<{
        success: boolean;
        data?: IFlightPreference;
        message?: string;
    }> {
        try {
            const data = await itineraryPreferencesRepository.getFlightPreferenceById(id);

            if (!data) {
                return {
                    success: false,
                    message: 'Flight preference not found'
                };
            }

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error getting flight preference by ID:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get flight preference'
            };
        }
    },

    /**
     * Get hotel preference by ID
     */
    async getHotelPreferenceById(id: string): Promise<{
        success: boolean;
        data?: IHotelPreference;
        message?: string;
    }> {
        try {
            const data = await itineraryPreferencesRepository.getHotelPreferenceById(id);

            if (!data) {
                return {
                    success: false,
                    message: 'Hotel preference not found'
                };
            }

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error getting hotel preference by ID:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get hotel preference'
            };
        }
    },

    /**
     * Get visa preference by ID
     */
    async getVisaPreferenceById(id: string): Promise<{
        success: boolean;
        data?: IVisaPreference;
        message?: string;
    }> {
        try {
            const data = await itineraryPreferencesRepository.getVisaPreferenceById(id);

            if (!data) {
                return {
                    success: false,
                    message: 'Visa preference not found'
                };
            }

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error getting visa preference by ID:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get visa preference'
            };
        }
    },

    /**
     * Get user preferences summary by ID
     */
    async getUserPreferencesSummaryById(id: string): Promise<{
        success: boolean;
        data?: IUserPreferencesSummary;
        message?: string;
    }> {
        try {
            const data = await itineraryPreferencesRepository.getUserPreferencesSummaryById(id);

            if (!data) {
                return {
                    success: false,
                    message: 'User preferences summary not found'
                };
            }

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error getting user preferences summary by ID:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get user preferences summary'
            };
        }
    },

    /**
     * Get any preference by ID (auto-detect type)
     */
    async getPreferenceById(id: string): Promise<{
        success: boolean;
        type?: 'flight' | 'hotel' | 'visa' | 'summary';
        data?: IFlightPreference | IHotelPreference | IVisaPreference | IUserPreferencesSummary;
        message?: string;
    }> {
        try {
            const result = await itineraryPreferencesRepository.getPreferenceById(id);

            if (!result.data) {
                return {
                    success: false,
                    message: 'Preference not found'
                };
            }

            return {
                success: true,
                type: result.type,
                data: result.data
            };
        } catch (error) {
            console.error('Error getting preference by ID:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get preference'
            };
        }
    },

    /**
     * Get all preferences by their IDs
     */
    async getPreferencesByIds(ids: {
        flightPreferenceIds?: string[];
        hotelPreferenceIds?: string[];
        visaPreferenceIds?: string[];
        summaryId?: string;
    }): Promise<{
        success: boolean;
        flightPreferences?: IFlightPreference[];
        hotelPreferences?: IHotelPreference[];
        visaPreferences?: IVisaPreference[];
        userPreferencesSummary?: IUserPreferencesSummary;
        message?: string;
    }> {
        try {
            const results = await Promise.all([
                // Fetch flight preferences
                ids.flightPreferenceIds && ids.flightPreferenceIds.length > 0
                    ? Promise.all(ids.flightPreferenceIds.map(id =>
                        itineraryPreferencesRepository.getFlightPreferenceById(id)
                    ))
                    : Promise.resolve([]),

                // Fetch hotel preferences
                ids.hotelPreferenceIds && ids.hotelPreferenceIds.length > 0
                    ? Promise.all(ids.hotelPreferenceIds.map(id =>
                        itineraryPreferencesRepository.getHotelPreferenceById(id)
                    ))
                    : Promise.resolve([]),

                // Fetch visa preferences
                ids.visaPreferenceIds && ids.visaPreferenceIds.length > 0
                    ? Promise.all(ids.visaPreferenceIds.map(id =>
                        itineraryPreferencesRepository.getVisaPreferenceById(id)
                    ))
                    : Promise.resolve([]),

                // Fetch user preferences summary
                ids.summaryId
                    ? itineraryPreferencesRepository.getUserPreferencesSummaryById(ids.summaryId)
                    : Promise.resolve(null)
            ]);

            const flightPreferences = results[0].filter(Boolean) as IFlightPreference[];
            const hotelPreferences = results[1].filter(Boolean) as IHotelPreference[];
            const visaPreferences = results[2].filter(Boolean) as IVisaPreference[];
            const userPreferencesSummary = results[3] as IUserPreferencesSummary | null;

            return {
                success: true,
                flightPreferences: flightPreferences.length > 0 ? flightPreferences : undefined,
                hotelPreferences: hotelPreferences.length > 0 ? hotelPreferences : undefined,
                visaPreferences: visaPreferences.length > 0 ? visaPreferences : undefined,
                userPreferencesSummary: userPreferencesSummary || undefined
            };
        } catch (error) {
            console.error('Error getting preferences by IDs:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get preferences'
            };
        }
    }
};