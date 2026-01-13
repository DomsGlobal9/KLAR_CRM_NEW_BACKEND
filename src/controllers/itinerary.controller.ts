import { Request, Response } from 'express';
import { itineraryService } from '../services/itinerary.service';
import {
    ICreateItineraryDTO,
    IUpdateItineraryDTO,
    IItineraryFilter,
    IAddServiceToItineraryDTO,
    IUpdateItineraryServiceDTO,
    IUpdateItineraryOptionDTO
} from '../interfaces/itinerary.interface';

export const itineraryController = {
    // ============ CRUD Operations ============

    /**
     * Create a new itinerary
     */
    async createItinerary(req: Request, res: Response) {
        try {
            const payload: ICreateItineraryDTO = req.body;
            const itinerary = await itineraryService.createItinerary(payload);

            res.status(201).json({
                success: true,
                message: 'Itinerary created successfully',
                data: itinerary
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create itinerary',
                error: error.message
            });
        }
    },

    /**
     * Create itinerary from frontend data
     */
    async createItineraryFromFrontend(req: Request, res: Response) {
        try {
            const frontendData = req.body;

            // Convert frontend data to DTO
            const payload = itineraryService.convertFrontendItineraryToDTO(frontendData);

            const itinerary = await itineraryService.createItinerary(payload);

            res.status(201).json({
                success: true,
                message: 'Itinerary created successfully from frontend data',
                data: itinerary
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create itinerary',
                error: error.message
            });
        }
    },

    /**
     * Get itinerary by ID
     */
    async getItineraryById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const itinerary = await itineraryService.getItineraryById(id);

            if (!itinerary) {
                return res.status(404).json({
                    success: false,
                    message: 'Itinerary not found'
                });
            }

            res.status(200).json({
                success: true,
                data: itinerary
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch itinerary',
                error: error.message
            });
        }
    },

    /**
     * Get itinerary by itinerary number
     */
    async getItineraryByNumber(req: Request, res: Response) {
        try {
            const { itineraryNumber } = req.params;
            const itinerary = await itineraryService.getItineraryByNumber(itineraryNumber);

            if (!itinerary) {
                return res.status(404).json({
                    success: false,
                    message: 'Itinerary not found'
                });
            }

            res.status(200).json({
                success: true,
                data: itinerary
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch itinerary',
                error: error.message
            });
        }
    },

    /**
     * Get all itineraries
     */
    async getAllItineraries(req: Request, res: Response) {
        try {
            const filter: IItineraryFilter = {
                search: req.query.search as string,
                status: req.query.status as string,
                client_email: req.query.client_email as string,
                from_date: req.query.from_date as string,
                to_date: req.query.to_date as string,
                is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
                sort_by: req.query.sort_by as 'created_at' | 'travel_date' | 'client_name',
                sort_order: req.query.sort_order as 'asc' | 'desc'
            };

            const itineraries = await itineraryService.getAllItineraries(filter);

            res.status(200).json({
                success: true,
                data: itineraries,
                count: itineraries.length
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch itineraries',
                error: error.message
            });
        }
    },

    /**
     * Update itinerary
     */
    async updateItinerary(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const payload: IUpdateItineraryDTO = req.body;

            const itinerary = await itineraryService.updateItinerary(id, payload);

            res.status(200).json({
                success: true,
                message: 'Itinerary updated successfully',
                data: itinerary
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to update itinerary',
                error: error.message
            });
        }
    },

    /**
     * Delete itinerary
     */
    async deleteItinerary(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await itineraryService.deleteItinerary(id);

            res.status(200).json({
                success: true,
                message: 'Itinerary deleted successfully'
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to delete itinerary',
                error: error.message
            });
        }
    },

    // ============ Service Management ============

    /**
     * Add service to itinerary
     */
    async addServiceToItinerary(req: Request, res: Response) {
        try {
            const { itineraryId } = req.params;
            const payload: IAddServiceToItineraryDTO = req.body;

            const itinerary = await itineraryService.addServiceToItinerary(itineraryId, payload);

            res.status(200).json({
                success: true,
                message: 'Service added to itinerary successfully',
                data: itinerary
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to add service to itinerary',
                error: error.message
            });
        }
    },

    /**
     * Remove service from itinerary
     */
    async removeServiceFromItinerary(req: Request, res: Response) {
        try {
            const { itineraryId, itineraryServiceId } = req.params;

            await itineraryService.removeServiceFromItinerary(itineraryId, itineraryServiceId);

            res.status(200).json({
                success: true,
                message: 'Service removed from itinerary successfully'
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to remove service from itinerary',
                error: error.message
            });
        }
    },

    /**
     * Update itinerary service
     */
    async updateItineraryService(req: Request, res: Response) {
        try {
            const { itineraryServiceId } = req.params;
            const payload: IUpdateItineraryServiceDTO = req.body;

            const service = await itineraryService.updateItineraryService(itineraryServiceId, payload);

            res.status(200).json({
                success: true,
                message: 'Itinerary service updated successfully',
                data: service
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update itinerary service',
                error: error.message
            });
        }
    },

    /**
     * Update itinerary option
     */
    async updateItineraryOption(req: Request, res: Response) {
        try {
            const { optionId } = req.params;
            const payload: IUpdateItineraryOptionDTO = req.body;

            const option = await itineraryService.updateItineraryOption(optionId, payload);

            res.status(200).json({
                success: true,
                message: 'Itinerary option updated successfully',
                data: option
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update itinerary option',
                error: error.message
            });
        }
    },

    /**
     * Remove option from itinerary
     */
    async removeOptionFromItinerary(req: Request, res: Response) {
        try {
            const { optionId } = req.params;

            await itineraryService.removeOptionFromItinerary(optionId);

            res.status(200).json({
                success: true,
                message: 'Option removed from itinerary successfully'
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to remove option from itinerary',
                error: error.message
            });
        }
    },

    // ============ Helper Endpoints ============

    /**
     * Change itinerary status
     */
    async changeItineraryStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Status is required'
                });
            }

            const itinerary = await itineraryService.changeItineraryStatus(id, status as any);

            res.status(200).json({
                success: true,
                message: `Itinerary status changed to ${status}`,
                data: itinerary
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 400;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to change itinerary status',
                error: error.message
            });
        }
    },

    /**
     * Update itinerary total price
     */
    async updateItineraryTotalPrice(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const totalPrice = await itineraryService.updateItineraryTotalPrice(id);

            res.status(200).json({
                success: true,
                message: 'Itinerary total price updated',
                data: {
                    total_price: totalPrice,
                    currency: 'INR'
                }
            });
        } catch (error: any) {
            const status = error.message.includes('not found') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Failed to update itinerary total price',
                error: error.message
            });
        }
    },

    /**
     * Get itinerary statistics
     */
    async getItineraryStatistics(req: Request, res: Response) {
        try {
            const statistics = await itineraryService.getItineraryStatistics();

            res.status(200).json({
                success: true,
                data: statistics
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch itinerary statistics',
                error: error.message
            });
        }
    },

    /**
     * Search itineraries
     */
    async searchItineraries(req: Request, res: Response) {
        try {
            const { q } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Search query (q) is required'
                });
            }

            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const itineraries = await itineraryService.searchItineraries(q, limit);

            res.status(200).json({
                success: true,
                data: itineraries,
                count: itineraries.length
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Failed to search itineraries',
                error: error.message
            });
        }
    },

    /**
     * Health check
     */
    async healthCheck(req: Request, res: Response) {
        res.status(200).json({
            success: true,
            message: 'Itinerary controller is working properly',
            timestamp: new Date().toISOString()
        });
    }
};