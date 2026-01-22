import { itineraryPreferencesRepository } from '../repositories/itinerary-preferences.repository';
import {
    IItineraryPreferencesResponse,
    IUpdatePreferenceData,
    IFrontendFormData,
    IVisaPreference,
    IHotelPreference,
    IFlightPreference,
    IPaginationParams,
    IAllItinerariesResponse
} from '../interfaces/itinerary-preferences.interface';
import { leadRepository } from '../repositories';

export const itineraryPreferencesService = {

    /**
     * Get all preferences for a lead
     */
    async getPreferences(leadId: string): Promise<{
        success: boolean;
        data?: IItineraryPreferencesResponse;
        message?: string;
    }> {
        try {
            const data = await itineraryPreferencesRepository.getByLeadId(leadId);
            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error getting lead preferences:', error);
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
        message?: string;
    }> {
        try {
            if (!formData.leadData?.id) {
                return {
                    success: false,
                    message: 'Lead ID is required'
                };
            }

            const leadId = formData.leadData.id;

            // Check if the lead is exist or not
            const isLeadExist = await leadRepository.isLeadExists(leadId);
            if (!isLeadExist) {
                throw new Error('Lead not found in Itenary preference Service');
            }

            // Check if preferences already exist
            const { exists } = await this.checkPreferencesExist(leadId);
            if (exists) {
                return {
                    success: false,
                    message: 'Preferences already exist for this lead. Use update instead.'
                };
            }

            // Transform and save
            const preferenceData = itineraryPreferencesRepository.transformFormData(formData);
            const data = await itineraryPreferencesRepository.saveAllPreferences(preferenceData);

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error saving lead preferences:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to save preferences'
            };
        }
    },

    /**
     * Update preferences
     */
    async updatePreferences(leadId: string, updateData: IUpdatePreferenceData): Promise<{
        success: boolean;
        data?: IItineraryPreferencesResponse;
        message?: string;
    }> {
        try {
            if (!leadId) {
                return {
                    success: false,
                    message: 'Lead ID is required'
                };
            }

            const data = await itineraryPreferencesRepository.updatePreferences(leadId, updateData);
            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Error updating lead preferences:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update preferences'
            };
        }
    },

    /**
     * Delete preferences
     */
    async deletePreferences(leadId: string): Promise<{
        success: boolean;
        message?: string;
    }> {
        try {
            await itineraryPreferencesRepository.deleteByLeadId(leadId);
            return {
                success: true,
                message: 'Preferences deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting lead preferences:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delete preferences'
            };
        }
    },

    /**
     * Check if lead has preferences
     */
    async checkPreferencesExist(leadId: string): Promise<{
        success: boolean;
        exists: boolean;
        message?: string;
    }> {
        try {
            const exists = await itineraryPreferencesRepository.hasPreferences(leadId);
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
     * Save or update preferences (upsert)
     */
    async saveOrUpdatePreferences(formData: IFrontendFormData): Promise<{
        success: boolean;
        data?: IItineraryPreferencesResponse;
        message?: string;
        action: 'created' | 'updated';
    }> {
        try {
            if (!formData.leadData?.id) {
                return {
                    success: false,
                    message: 'Lead ID is required',
                    action: 'created'
                };
            }

            const leadId = formData.leadData.id;
            const { exists } = await this.checkPreferencesExist(leadId);

            const preferenceData = itineraryPreferencesRepository.transformFormData(formData);

            let data: IItineraryPreferencesResponse;
            if (exists) {
                data = await itineraryPreferencesRepository.updatePreferences(leadId, {
                    flightPreferences: preferenceData.flightPreferences,
                    hotelPreferences: preferenceData.hotelPreferences,
                    visaPreferences: preferenceData.visaPreferences,
                    userPreferences: preferenceData.userPreferences
                });
            } else {
                data = await itineraryPreferencesRepository.saveAllPreferences(preferenceData);
            }

            return {
                success: true,
                data,
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
     * Get all leads with pagination (admin)
     */
    async getAllLeads(params?: IPaginationParams): Promise<IAllItinerariesResponse> {
        try {
            const result = await itineraryPreferencesRepository.getAllLeadsPaginated(params);

            let totalFlightPrefs = 0;
            let totalHotelPrefs = 0;
            let totalVisaPrefs = 0;
            let leadsWithFlightPrefs = 0;
            let leadsWithHotelPrefs = 0;
            let leadsWithVisaPrefs = 0;
            let completeLeads = 0;

            result.leads.forEach(lead => {
                totalFlightPrefs += lead.flight_preferences.length;
                totalHotelPrefs += lead.hotel_preferences.length;
                totalVisaPrefs += lead.visa_preferences.length;

                if (lead.flight_preferences.length > 0) leadsWithFlightPrefs++;
                if (lead.hotel_preferences.length > 0) leadsWithHotelPrefs++;
                if (lead.visa_preferences.length > 0) leadsWithVisaPrefs++;

                if (lead.flight_preferences.length > 0 &&
                    lead.hotel_preferences.length > 0 &&
                    lead.visa_preferences.length > 0) {
                    completeLeads++;
                }
            });

            return {
                success: true,
                data: {
                    leads: result.leads,
                    total_count: result.total_count,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total_pages: result.total_pages
                    }
                },
                summary: {
                    total_leads: result.total_count,
                    total_flight_preferences: totalFlightPrefs,
                    total_hotel_preferences: totalHotelPrefs,
                    total_visa_preferences: totalVisaPrefs,
                    leads_with_flight_prefs: leadsWithFlightPrefs,
                    leads_with_hotel_prefs: leadsWithHotelPrefs,
                    leads_with_visa_prefs: leadsWithVisaPrefs,
                    complete_leads: completeLeads
                }
            };
        } catch (error) {
            console.error('Error in getAllLeads service:', error);
            return {
                success: false,
                data: {
                    leads: [],
                    total_count: 0
                },
                message: error instanceof Error ? error.message : 'Failed to get all leads'
            };
        }
    }
};