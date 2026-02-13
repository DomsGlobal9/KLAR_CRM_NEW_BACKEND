import { Request, Response } from 'express';
import { inquirySourceService } from '../services';

class InquirySourceController {

    async getAllSources(req: Request, res: Response) {
        try {
            const { includeInactive } = req.query;
            const sources = await inquirySourceService.getAllSources(includeInactive === 'true');

            res.json({
                success: true,
                data: sources
            });
        } catch (error: any) {
            console.error('Error fetching inquiry sources:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getSourcesByCategory(req: Request, res: Response) {
        try {
            const grouped = await inquirySourceService.getSourcesByCategory();

            res.json({
                success: true,
                data: grouped
            });
        } catch (error: any) {
            console.error('Error fetching grouped sources:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async createSource(req: Request, res: Response) {
        try {
            const { name, value, label, category, display_order } = req.body;
            const userId = (req as any).user?.id;

            // Validate required fields
            if (!name || !value || !label) {
                return res.status(400).json({
                    success: false,
                    error: 'Name, value, and label are required'
                });
            }

            const source = await inquirySourceService.createSource({
                name,
                value,
                label,
                category,
                display_order
            }, userId);

            res.status(201).json({
                success: true,
                message: 'Inquiry source created successfully',
                data: source
            });
        } catch (error: any) {
            console.error('Error creating inquiry source:', error);

            // Handle specific errors
            if (error.message === 'Source with this value already exists') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to create inquiry source'
            });
        }
    }

    async updateSource(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const userId = (req as any).user?.id;

            const source = await inquirySourceService.updateSource(id as string, updates, userId);

            res.json({
                success: true,
                message: 'Inquiry source updated successfully',
                data: source
            });
        } catch (error: any) {
            console.error('Error updating inquiry source:', error);

            if (error.message === 'Source not found') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            if (error.message === 'Source with this value already exists') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to update inquiry source'
            });
        }
    }

    async deleteSource(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.id;

            const result = await inquirySourceService.deleteSource(id as string, userId);

            res.json({
                success: true,
                message: result.message,
                data: result.data
            });
        } catch (error: any) {
            console.error('Error deleting inquiry source:', error);

            if (error.message === 'Source not found') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to delete inquiry source'
            });
        }
    }

    async toggleSourceStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.id;

            const source = await inquirySourceService.toggleSourceStatus(id as string, userId);

            res.json({
                success: true,
                message: `Source ${source.is_active ? 'activated' : 'deactivated'} successfully`,
                data: source
            });
        } catch (error: any) {
            console.error('Error toggling source status:', error);

            if (error.message === 'Source not found') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to toggle source status'
            });
        }
    }

    async updateDisplayOrder(req: Request, res: Response) {
        try {
            const { sources } = req.body;
            const userId = (req as any).user?.id;

            if (!Array.isArray(sources)) {
                return res.status(400).json({
                    success: false,
                    error: 'Sources array is required'
                });
            }

            await inquirySourceService.updateDisplayOrder(sources, userId);

            res.json({
                success: true,
                message: 'Display order updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating display order:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to update display order'
            });
        }
    }
}

export const inquirySourceController = new InquirySourceController();