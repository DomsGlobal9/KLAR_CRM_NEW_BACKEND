import { Request, Response } from 'express';
import { itineraryPreferencesService } from '../services';
import {
    IUpdatePreferenceData,
    IFrontendFormData,
    IDateRangeParams,
    IPaginationParams
} from '../interfaces';
import {
    validateFormData,
    calculateFormStats,
    formatFormDataForDisplay
} from '../helpers';
import { AuthRequest } from '../middleware';

export const itineraryPreferencesController = {

    /**
     * Get all preferences for a lead
     */
    async getPreferences(req: Request, res: Response) {
        try {
            const { leadId } = req.params;

            if (!leadId) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID is required'
                });
            }

            const result = await itineraryPreferencesService.getPreferences(leadId as string);

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
     * Save preferences
     */
    async savePreferences(req: Request, res: Response) {
        try {
            const formData: IFrontendFormData = req.body;

            if (!formData?.leadData?.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID is required'
                });
            }

            const result = await itineraryPreferencesService.savePreferences(formData);

            if (!result.success) {
                return res.status(400).json(result);
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
     * Update preferences
     */
    async updatePreferences(req: Request, res: Response) {
        try {
            const { leadId } = req.params;
            const updateData: IUpdatePreferenceData = req.body;

            if (!leadId) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID is required'
                });
            }

            if (!updateData || Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Update data is required'
                });
            }

            const result = await itineraryPreferencesService.updatePreferences(leadId as string, updateData);

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
     * Delete preferences
     */
    async deletePreferences(req: Request, res: Response) {
        try {
            const { leadId } = req.params;

            if (!leadId) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID is required'
                });
            }

            const result = await itineraryPreferencesService.deletePreferences(leadId as string);

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
     * Check if lead has preferences
     */
    async checkPreferencesExist(req: Request, res: Response) {
        try {
            const { leadId } = req.params;

            if (!leadId) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID is required'
                });
            }

            const result = await itineraryPreferencesService.checkPreferencesExist(leadId as string);

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
     * Save or update preferences (upsert)
     */
    async saveOrUpdatePreferences(req: Request, res: Response) {
        try {
            const formData: IFrontendFormData = req.body;

            if (!formData?.leadData?.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID is required'
                });
            }

            const result = await itineraryPreferencesService.saveOrUpdatePreferences(formData);

            if (!result.success) {
                return res.status(400).json(result);
            }

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
     * Get all leads with preferences (admin endpoint)
     */
    async getAllLeads(req: AuthRequest, res: Response) {
        try {
            const leadId = req.query.id as string;
            const minimal = req.query.minimal === 'true';
            const detailed = req.query.detailed === 'true';

            const userDetails = req.user;
            const userRole = userDetails?.role;
            const userId = userDetails?.id;
            
            if (leadId) {
                
                if (userRole === 'rm') {
                    const hasAccess = await itineraryPreferencesService.checkLeadAccess(leadId, userId as string);
                    if (!hasAccess) {
                        return res.status(403).json({
                            success: false,
                            message: 'You do not have permission to access this lead'
                        });
                    }
                }

                const singleResult = await itineraryPreferencesService.getPreferences(leadId);

                if (!singleResult.success || !singleResult.data) {
                    return res.status(404).json({
                        success: false,
                        message: `Lead with ID ${leadId} not found`
                    });
                }

                return res.status(200).json({
                    success: true,
                    data: {
                        leads: [singleResult.data],
                        total_count: 1
                    }
                });
            }

            
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || (minimal ? 100 : 50);
            const sortOrder = (req.query.sort_order as 'asc' | 'desc') || 'desc';

            
            const roleFilter = {
                role: userRole,
                userId: userId,
                assignedToField: 'assigned_to'
            };

            
            if (detailed) {
                const paginationParams: IPaginationParams = {
                    page: Math.max(1, page),
                    limit: Math.min(Math.max(1, limit), 50),
                    sort_by: 'updated_at',
                    sort_order: sortOrder
                };

                const result = await itineraryPreferencesService.getAllLeads(paginationParams, roleFilter);
                return res.status(200).json(result);
            }

            
            const paginationParams: IPaginationParams = {
                page: Math.max(1, page),
                limit: Math.min(Math.max(1, limit), 100),
                sort_by: 'updated_at',
                sort_order: sortOrder
            };

            if (minimal) {
                const result = await itineraryPreferencesService.getAllLeadsMinimal(paginationParams, roleFilter);
                return res.status(200).json(result);
            } else {
                const result = await itineraryPreferencesService.getAllLeadsBasic(paginationParams, roleFilter);
                return res.status(200).json(result);
            }

        } catch (error) {
            console.error('Error in getAllLeads controller:', error);
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

            const validation = validateFormData(formData);
            const stats = calculateFormStats(formData);
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
    }
};