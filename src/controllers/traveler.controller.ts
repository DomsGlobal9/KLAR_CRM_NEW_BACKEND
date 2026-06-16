import { Request, Response } from 'express';
import { travelerService } from '../services/traveler.service';
import { CreateTravelerPayload, UpdateTravelerPayload } from '../models/traveler.model';

export const travelerController = {

    /**
     * Create a new traveler
     */
    async createTraveler(req: Request, res: Response) {
        try {
            const payload: CreateTravelerPayload = req.body;

            const traveler = await travelerService.createTraveler(payload);

            res.status(201).json({
                success: true,
                message: 'Traveler created successfully',
                data: traveler
            });
        } catch (error: any) {
            console.error("❌ Traveler creation error:", error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Get all travelers
     */
    async getAllTravelers(req: Request, res: Response) {
        try {
            const filter = {
                search: req.query.search as string,
                title: req.query.title as string,
                date_from: req.query.date_from as string,
                date_to: req.query.date_to as string,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
            };

            const travelers = await travelerService.getAllTravelers(filter);

            res.json({
                success: true,
                data: travelers,
                count: travelers.length
            });
        } catch (error: any) {
            console.error("❌ Get all travelers error:", error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Get traveler by ID
     */
    async getTravelerById(req: Request, res: Response) {
        try {
            // Fix: Ensure id is a string
            const { id } = req.params;
            const travelerId = Array.isArray(id) ? id[0] : id;

            if (!travelerId) {
                return res.status(400).json({
                    success: false,
                    error: 'Traveler ID is required'
                });
            }

            const traveler = await travelerService.getTravelerById(travelerId);

            res.json({
                success: true,
                data: traveler
            });
        } catch (error: any) {
            console.error("❌ Get traveler by ID error:", error);
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Update traveler
     */
    async updateTraveler(req: Request, res: Response) {
        try {
            // Fix: Ensure id is a string
            const { id } = req.params;
            const travelerId = Array.isArray(id) ? id[0] : id;

            if (!travelerId) {
                return res.status(400).json({
                    success: false,
                    error: 'Traveler ID is required'
                });
            }

            const payload: UpdateTravelerPayload = req.body;

            await travelerService.updateTraveler(travelerId, payload);

            res.json({
                success: true,
                message: 'Traveler updated successfully'
            });
        } catch (error: any) {
            console.error("❌ Update traveler error:", error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Delete traveler
     */
    async deleteTraveler(req: Request, res: Response) {
        try {
            // Fix: Ensure id is a string
            const { id } = req.params;
            const travelerId = Array.isArray(id) ? id[0] : id;

            if (!travelerId) {
                return res.status(400).json({
                    success: false,
                    error: 'Traveler ID is required'
                });
            }

            await travelerService.deleteTraveler(travelerId);

            res.json({
                success: true,
                message: 'Traveler deleted successfully'
            });
        } catch (error: any) {
            console.error("❌ Delete traveler error:", error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Search travelers
     */
    async searchTravelers(req: Request, res: Response) {
        try {
            const { q } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
            }

            const travelers = await travelerService.searchTravelers(q);

            res.json({
                success: true,
                data: travelers,
                count: travelers.length
            });
        } catch (error: any) {
            console.error("❌ Search travelers error:", error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
 * Filter and sort travelers with POST body
 */
    async filterAndSortTravelers(req: Request, res: Response) {
        try {
            const { filters, sort, pagination } = req.body;

            const result = await travelerService.filterAndSortTravelers(filters, sort, pagination);

            res.json({
                success: true,
                data: result.travelers,
                pagination: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages,
                    limit: pagination?.limit || 10
                },
                filters: filters || {},
                sort: sort || { field: 'created_at', order: 'desc' }
            });
        } catch (error: any) {
            console.error("❌ Filter and sort travelers error:", error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },


    /**
     * Bulk create travelers from Excel upload
     */
    async bulkCreateTravelers(req: Request, res: Response) {
        try {
            const { travelers } = req.body;

            if (!travelers || !Array.isArray(travelers) || travelers.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No traveler data provided'
                });
            }

            // Validate file size (max 1000 rows)
            if (travelers.length > 1000) {
                return res.status(400).json({
                    success: false,
                    error: 'Maximum 1000 rows allowed per upload'
                });
            }

            const result = await travelerService.bulkCreateTravelers(travelers);

            res.json({
                success: true,
                data: result,
                message: `Upload complete: ${result.created} created, ${result.skipped} skipped, ${result.errors.length} errors`
            });
        } catch (error: any) {
            console.error("❌ Bulk create travelers error:", error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
};