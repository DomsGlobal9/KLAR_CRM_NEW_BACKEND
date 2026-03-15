import { Request, Response } from 'express';
import { leadService } from '../services';
import { CreateLeadPayload, UpdateLeadPayload, LeadFilter } from '../interfaces';
import { createLeadAuditLog } from '../helpers';
import { LeadDataMapper } from '../utils/lead-data-mapper';
import { AuthRequest } from '../middleware';

export const leadController = {

    /**
     * Create quick lead
     */
    async createQuickLead(req: Request, res: Response) {
        try {
            const payload = req.body;

            const mappedPayload = LeadDataMapper.mapFrontendToDatabase(payload);

            const lead = await leadService.createLead(mappedPayload);

            const frontendLead = LeadDataMapper.mapDatabaseToFrontend(lead);

            res.status(201).json({
                success: true,
                message: 'Quick lead created successfully',
                data: frontendLead
            });

        } catch (error: any) {
            console.error("❌ Quick Lead creation error:", error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },


    /**
     * Create a new lead
     */
    async createLead(req: Request, res: Response) {
        try {
            const payload: CreateLeadPayload = req.body;

            const mappedPayload = LeadDataMapper.mapFrontendToDatabase(payload);

            const lead = await leadService.createLead(mappedPayload);

            const frontendLead = LeadDataMapper.mapDatabaseToFrontend(lead);

            await createLeadAuditLog({
                action: 'LEAD_CREATED',
                entity_type: 'lead',
                entity_id: lead.id,
                details: `Lead created: ${lead.name} (${lead.email})`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.status(201).json({
                success: true,
                message: 'Lead created successfully',
                data: frontendLead
            });
        } catch (error: any) {
            console.error("❌ Lead creation error:", error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Capture lead from web form (public endpoint)
     */
    async captureWebLead(req: Request, res: Response) {
        try {
            const payload: CreateLeadPayload = req.body;


            const utmParams = {
                utm_source: req.query.utm_source as string,
                utm_medium: req.query.utm_medium as string,
                utm_campaign: req.query.utm_campaign as string,
                utm_term: req.query.utm_term as string,
                utm_content: req.query.utm_content as string,
                source: req.query.source as string || 'web_form',
                source_medium: req.query.source_medium as string
            };


            const leadPayload = {
                ...payload,
                ...utmParams
            };

            const lead = await leadService.captureWebLead(leadPayload);

            res.status(201).json({
                success: true,
                message: 'Thank you! We will contact you shortly.',
                data: {
                    id: lead.id,
                    name: lead.name,
                    email: lead.email
                }
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Get all leads with filtering
     */
    async getAllLeads(req: AuthRequest, res: Response) {

        try {
            const filter: LeadFilter = {
                search: req.query.search as string,
                stage: req.query.stage as string,
                status: req.query.status as string,
                customer_category: req.query.customer_category as string,
                assigned_to: req.query.assigned_to as string,
                type: req.query.type as string,
                date_from: req.query.date_from as string,
                date_to: req.query.date_to as string,
                limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
            };

            const leads = await leadService.getAllLeads(filter, req.user);

            const frontendLeads = leads.map(lead =>
                LeadDataMapper.mapDatabaseToFrontend(lead)
            );

            res.json({
                success: true,
                data: frontendLeads,
                count: leads.length
            });

        } catch (error: any) {
            console.error("❌ Get all leads error:", error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Get lead by ID
     */
    async getLeadById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const lead = await leadService.getLeadById(id as string);

            const frontendLead = LeadDataMapper.mapDatabaseToFrontend(lead);

            res.json({
                success: true,
                data: frontendLead
            });
        } catch (error: any) {
            console.error("❌ Get lead by ID error:", error);
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Update lead
     */
    async updateLead(req: Request, res: Response) {

        try {
            const { id } = req.params;
            const payload: UpdateLeadPayload = req.body;

            console.log("📥 Update payload received:", JSON.stringify(payload, null, 2));

            const mappedPayload = LeadDataMapper.mapFrontendToDatabaseForUpdate(payload);

            const updated = await leadService.updateLead(id as string, mappedPayload);

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    error: 'Lead not found or update failed'
                });
            }

            res.json({
                success: true,
                message: 'Lead updated successfully',
                data: []
            });

        } catch (error: any) {
            console.error("❌ Update lead error:", error);
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Delete lead
     */
    async deleteLead(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await leadService.deleteLead(id as string);

            // Create audit log
            await createLeadAuditLog({
                // user_id: req.user?.id,
                action: 'LEAD_DELETED',
                entity_type: 'lead',
                entity_id: id as string,
                details: 'Lead deleted',
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.json({
                success: true,
                message: 'Lead deleted successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Get lead statistics
     */
    async getLeadStats(req: Request, res: Response) {
        try {
            const leadId = req.query.id as string;

            const stats = await leadService.getLeadStats(leadId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Update lead stage
     */
    async updateLeadStage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { stageId } = req.body;

            if (!stageId) {
                return res.status(400).json({
                    success: false,
                    error: 'Stage ID are required'
                });
            }

            const lead = await leadService.updateLeadStage(id as string, stageId);

            res.json({
                success: true,
                message: `Lead moved to new stage Successfully`,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Assign lead to user
     */
    async assignLead(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { assigned_to } = req.body;

            if (!assigned_to) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID is required for assignment'
                });
            }

            const lead = await leadService.assignLead(id as string, assigned_to);

            // Create audit log
            await createLeadAuditLog({
                // user_id: req.user?.id,
                action: 'LEAD_ASSIGNED',
                entity_type: 'lead',
                entity_id: id as string,
                details: `Lead assigned to ${assigned_to}`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.json({
                success: true,
                message: 'Lead assigned successfully',
                data: lead
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Search leads
     */
    async searchLeads(req: Request, res: Response) {
        try {
            const { q } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Search query is required'
                });
            }

            const leads = await leadService.searchLeads(q);

            res.json({
                success: true,
                data: leads,
                count: leads.length
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
};