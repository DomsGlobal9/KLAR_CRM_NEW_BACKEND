import { Request, Response } from 'express';
import { itineraryPreferencesService } from '../services';
import {
    IUpdatePreferenceData,
    IFrontendFormData,
    IAllRelatedDetailsResponse,
    IAllRelatedDetailsByIdsResponse,
    IDateRangeParams,
    IPaginationParams
} from '../interfaces';
import {
    validateFormData,
    calculateFormStats,
    formatFormDataForDisplay
} from '../helpers';
import { normalizeFrontendPayload } from '../adapters';


export const itineraryPreferencesController = {

    /**
     * Get all preferences for an itinerary WITH SUMMARY
     */
    async getPreferencesWithSummary(req: Request, res: Response) {
        try {
            const { itineraryId } = req.params;

            if (!itineraryId) {
                return res.status(400).json({
                    success: false,
                    message: 'Itinerary ID is required'
                });
            }

            const result = await itineraryPreferencesService.getPreferencesWithSummary(itineraryId as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getPreferencesWithSummary controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Validate form data without saving
     */
    async validatePreferences(req: Request, res: Response) {
        try {
            const formData: IFrontendFormData = req.body;

            if (!formData) {
                return res.status(400).json({
                    success: false,
                    message: 'Request body is required'
                });
            }

            // Use validateFormData
            const validation = validateFormData(formData);

            // Use calculateFormStats
            const stats = calculateFormStats(formData);

            // Use formatFormDataForDisplay
            const formattedData = formatFormDataForDisplay(formData);

            return res.status(200).json({
                success: true,
                validation,
                statistics: stats,
                formatted_data: formattedData,
                message: validation.isValid ? 'Form data is valid' : 'Form data validation failed'
            });
        } catch (error) {
            console.error('Error in validatePreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get all preferences for an itinerary
     */
    async getPreferences(req: Request, res: Response) {
        try {
            const { itineraryId } = req.params;

            if (!itineraryId) {
                return res.status(400).json({
                    success: false,
                    message: 'Itinerary ID is required'
                });
            }

            const result = await itineraryPreferencesService.getPreferences(itineraryId as string);
            

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getPreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Save preferences from frontend form (console data format)
     */
    async savePreferences(req: Request, res: Response) {
        try {
            const payload = req.body;

            const formData = normalizeFrontendPayload(req.body);

            if (!formData.itineraryData?.id) {
                return res.status(400).json({ success: false, message: 'Itinerary ID required' });
            }

            const itineraryId = formData.itineraryData.id;

            // ← Add this check
            const { exists } = await itineraryPreferencesService.checkPreferencesExist(itineraryId);
            if (exists) {
                return res.status(409).json({
                    success: false,
                    message: 'Preferences already exist for this itinerary. Use PUT to update or create a new itinerary.',
                    itineraryId
                });
            }

            // Now validation & save can proceed normally
            const validation = validateFormData(formData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validation.errors,
                    warnings: validation.warnings
                });
            }

            const stats = calculateFormStats(formData);
            const formatted = formatFormDataForDisplay(formData);


            const result = await itineraryPreferencesService.savePreferences(formData);

            if (!result.success) {
                return res.status(400).json(result);
            }

            console.log('✅ Preferences saved successfully for itinerary:', formData.itineraryData?.id);

            // Log validation warnings if any
            if (result.validation?.warnings?.length > 0) {
                console.warn('Validation warnings:', result.validation.warnings);
            }

            return res.status(201).json({
                ...result,
                message: 'Preferences saved successfully'
            });
        } catch (error) {
            console.error('Error in savePreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Save or update preferences (upsert)
     */
    async saveOrUpdatePreferences(req: Request, res: Response) {
        try {
            const formData: IFrontendFormData = req.body;

            if (!formData) {
                return res.status(400).json({
                    success: false,
                    message: 'Request body is required'
                });
            }

            console.log('🔄 Save/Update request for itinerary:', formData.itineraryData?.id);

            const result = await itineraryPreferencesService.saveOrUpdatePreferences(formData);

            if (!result.success) {
                return res.status(400).json(result);
            }

            console.log(`✅ Preferences ${result.action} successfully for itinerary:`, formData.itineraryData?.id);

            return res.status(200).json({
                ...result,
                message: `Preferences ${result.action} successfully`
            });
        } catch (error) {
            console.error('Error in saveOrUpdatePreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Update specific preferences
     */
    async updatePreferences(req: Request, res: Response) {
        try {
            const { itineraryId } = req.params;
            const updateData: IUpdatePreferenceData = req.body;

            if (!itineraryId) {
                return res.status(400).json({
                    success: false,
                    message: 'Itinerary ID is required'
                });
            }

            if (!updateData || Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Update data is required'
                });
            }

            const result = await itineraryPreferencesService.updatePreferences(itineraryId as string, updateData);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json({
                ...result,
                message: 'Preferences updated successfully'
            });
        } catch (error) {
            console.error('Error in updatePreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Delete all preferences for an itinerary
     */
    async deletePreferences(req: Request, res: Response) {
        try {
            const { itineraryId } = req.params;

            if (!itineraryId) {
                return res.status(400).json({
                    success: false,
                    message: 'Itinerary ID is required'
                });
            }

            const result = await itineraryPreferencesService.deletePreferences(itineraryId as string);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in deletePreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Check if itinerary has preferences
     */
    async checkPreferencesExist(req: Request, res: Response) {
        try {
            const { itineraryId } = req.params;

            if (!itineraryId) {
                return res.status(400).json({
                    success: false,
                    message: 'Itinerary ID is required'
                });
            }

            const result = await itineraryPreferencesService.checkPreferencesExist(itineraryId as string);

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in checkPreferencesExist controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get formatted preferences for display
     */
    async getFormattedPreferences(req: Request, res: Response) {
        try {
            const { itineraryId } = req.params;

            if (!itineraryId) {
                return res.status(400).json({
                    success: false,
                    message: 'Itinerary ID is required'
                });
            }

            const result = await itineraryPreferencesService.getPreferences(itineraryId as string);

            if (!result.success || !result.data) {
                return res.status(404).json(result);
            }

            // Format the response data for display
            const formattedData = formatFormDataForDisplay({
                itineraryData: {
                    id: result.data.itinerary_id,
                    client_name: 'Not available', // You might want to get this from itinerary
                    from_location: 'Not available',
                    to_location: 'Not available',
                    travel_date: 'Not available'
                },
                flightOptions: result.data.flight_preferences.map(fp => ({
                    airline: fp.airline,
                    route: fp.route,
                    stops: fp.stops,
                    cabinClass: fp.cabin_class,
                    estimatedPricePerPerson: fp.estimated_price_per_person?.toString(),
                    departureArrivalTime: fp.departure_arrival_time,
                    fareType: fp.fare_type,
                    preferredTimeSlot: fp.preferred_time_slot,
                    betterConnectionDuration: fp.better_connection_duration,
                    flexibleSchedule: fp.flexible_schedule
                })),
                hotelOptions: result.data.hotel_preferences.map(hp => ({
                    hotelCategory: hp.hotel_category,
                    mealPlan: hp.meal_plan,
                    estimatedPricePerNight: hp.estimated_price_per_night?.toString(),
                    estimatedTotalStayCost: hp.estimated_total_stay_cost?.toString(),
                    stayType: hp.stay_type,
                    location: hp.location,
                    roomType: hp.room_type,
                    betterLocation: hp.better_location,
                    premiumAmenities: hp.premium_amenities,
                    experienceHighlights: hp.experience_highlights
                })),
                visaOptions: result.data.visa_preferences.map(vp => ({
                    visaType: vp.visa_type,
                    processingTime: vp.processing_time,
                    estimatedTotalCost: vp.estimated_total_cost?.toString(),
                    documentChecklist: vp.document_checklist,
                    specialRequirements: vp.special_requirements
                })),
                userPreferences: {
                    flightPreferencesAdded: result.data.user_preferences_summary?.flight_preferences_added || false,
                    hotelPreferencesAdded: result.data.user_preferences_summary?.hotel_preferences_added || false,
                    visaPreferencesAdded: result.data.user_preferences_summary?.visa_preferences_added || false,
                    lastUpdated: result.data.user_preferences_summary?.last_updated || new Date().toISOString()
                }
            });

            return res.status(200).json({
                success: true,
                formatted_data: formattedData,
                raw_data: result.data
            });
        } catch (error) {
            console.error('Error in getFormattedPreferences controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get flight preference by ID
     */
    async getFlightPreferenceById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Flight preference ID is required'
                });
            }

            const result = await itineraryPreferencesService.getFlightPreferenceById(id as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getFlightPreferenceById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get hotel preference by ID
     */
    async getHotelPreferenceById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Hotel preference ID is required'
                });
            }

            const result = await itineraryPreferencesService.getHotelPreferenceById(id as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getHotelPreferenceById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get visa preference by ID
     */
    async getVisaPreferenceById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Visa preference ID is required'
                });
            }

            const result = await itineraryPreferencesService.getVisaPreferenceById(id as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getVisaPreferenceById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get user preferences summary by ID
     */
    async getUserPreferencesSummaryById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'User preferences summary ID is required'
                });
            }

            const result = await itineraryPreferencesService.getUserPreferencesSummaryById(id as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getUserPreferencesSummaryById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get any preference by ID (auto-detect type)
     */
    async getPreferenceById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Preference ID is required'
                });
            }

            const result = await itineraryPreferencesService.getPreferenceById(id as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getPreferenceById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get preferences by multiple IDs
     */
    async getPreferencesByIds(req: Request, res: Response) {
        try {
            const {
                flightPreferenceIds,
                hotelPreferenceIds,
                visaPreferenceIds,
                summaryId
            } = req.body;

            // At least one ID should be provided
            if (
                (!flightPreferenceIds || flightPreferenceIds.length === 0) &&
                (!hotelPreferenceIds || hotelPreferenceIds.length === 0) &&
                (!visaPreferenceIds || visaPreferenceIds.length === 0) &&
                !summaryId
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one preference ID is required'
                });
            }

            const result = await itineraryPreferencesService.getPreferencesByIds({
                flightPreferenceIds: Array.isArray(flightPreferenceIds) ? flightPreferenceIds : undefined,
                hotelPreferenceIds: Array.isArray(hotelPreferenceIds) ? hotelPreferenceIds : undefined,
                visaPreferenceIds: Array.isArray(visaPreferenceIds) ? visaPreferenceIds : undefined,
                summaryId
            });

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getPreferencesByIds controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get all related details from database by ID only (auto-detects type)
     */
    async getAllRelatedDetailsById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID is required'
                });
            }

            const result = await itineraryPreferencesService.getAllRelatedDetailsById(id as string);

            if (!result.success) {
                return res.status(404).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getAllRelatedDetailsById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },



    /**
     * Get all itineraries with preferences (admin endpoint)
     */
    async getAllItineraries(req: Request, res: Response) {
        console.log("Enter into function to get all details");
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const sortOrder = (req.query.sort_order as 'asc' | 'desc') || 'desc';

            const ALLOWED_SORT_FIELDS = [
                'created_at',
                'updated_at',
                'last_updated'
            ] as const;

            type SortByField = typeof ALLOWED_SORT_FIELDS[number];

            const rawSortBy = req.query.sort_by as string | undefined;

            const sortBy: SortByField =
                ALLOWED_SORT_FIELDS.includes(rawSortBy as SortByField)
                    ? (rawSortBy as SortByField)
                    : 'updated_at';

            const paginationParams: IPaginationParams = {
                page: Math.max(1, page),
                limit: Math.min(Math.max(1, limit), 100),
                sort_by: sortBy,
                sort_order: sortOrder
            };

            const result = await itineraryPreferencesService.getAllItineraries(paginationParams);
            console.log("&&&&&&&&&&&&&&&&&&&\nThe data we get from service", result);

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getAllItineraries controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },


    /**
     * Get summary statistics of all itineraries
     */
    async getAllItinerariesSummary(req: Request, res: Response) {
        try {
            const result = await itineraryPreferencesService.getAllItinerariesSummary();

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getAllItinerariesSummary controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get recent itineraries (paginated)
     */
    async getRecentItineraries(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await itineraryPreferencesService.getRecentItineraries(limit);

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getRecentItineraries controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    /**
     * Get itineraries within a date range
     */
    async getItinerariesByDateRange(req: Request, res: Response) {
        try {
            const { start_date, end_date, field } = req.query;

            if (!start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    message: 'start_date and end_date are required'
                });
            }

            const dateRangeParams: IDateRangeParams = {
                start_date: start_date as string,
                end_date: end_date as string,
                field: (field as 'created_at' | 'updated_at' | 'last_updated') || 'updated_at'
            };

            const result = await itineraryPreferencesService.getItinerariesByDateRange(dateRangeParams);

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getItinerariesByDateRange controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

};