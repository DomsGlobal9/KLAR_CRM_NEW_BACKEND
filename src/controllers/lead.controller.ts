import { Request, Response } from 'express';
import { leadService } from '../services';
import { 
    CreateLeadPayload, 
    UpdateLeadPayload, 
    LeadFilter,
    CreateFlightRequirementPayload,
    CreateHotelRequirementPayload,
    CreateJourneyDetailsPayload
} from '../interfaces/lead.interface';
import { createLeadAuditLog } from '../helpers';

export const leadController = {
    // ============================================
    // EXISTING ENDPOINTS (Keep backward compatible)
    // ============================================

    /**
     * Create a new lead (ENHANCED - now supports flight/hotel/journey)
     */
    async createLead(req: Request, res: Response) {
        try {
            const payload: CreateLeadPayload = req.body;

            console.log("Lead data received from frontend:", req.body);

            const lead = await leadService.createLead(payload);

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
     * Capture lead from web form (public endpoint)
     */
    async captureWebLead(req: Request, res: Response) {
        try {
            const payload: CreateLeadPayload = req.body;

            // Add UTM parameters from query string
            const utmParams = {
                utm_source: req.query.utm_source as string,
                utm_medium: req.query.utm_medium as string,
                utm_campaign: req.query.utm_campaign as string,
                utm_term: req.query.utm_term as string,
                utm_content: req.query.utm_content as string,
                source: req.query.source as string || 'web_form',
                source_medium: req.query.source_medium as string
            };

            // Merge UTM params with payload
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
    async getAllLeads(req: Request, res: Response) {
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

            const leads = await leadService.getAllLeads(filter);

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
    },

    /**
     * Get lead by ID (basic requirements only - backward compatible)
     */
    async getLeadById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const lead = await leadService.getLeadById(id);

            res.json({
                success: true,
                data: lead
            });
        } catch (error: any) {
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

            const lead = await leadService.updateLead(id, payload);

            await createLeadAuditLog({
                action: 'LEAD_UPDATED',
                entity_type: 'lead',
                entity_id: id,
                details: `Lead updated: ${lead.name}`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.json({
                success: true,
                message: 'Lead updated successfully',
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
     * Delete lead
     */
    async deleteLead(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await leadService.deleteLead(id);

            await createLeadAuditLog({
                action: 'LEAD_DELETED',
                entity_type: 'lead',
                entity_id: id,
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
            const stats = await leadService.getLeadStats();

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
            const { stage } = req.body;

            if (!stage) {
                return res.status(400).json({
                    success: false,
                    error: 'Stage is required'
                });
            }

            const lead = await leadService.updateLeadStage(id, stage);

            await createLeadAuditLog({
                action: 'LEAD_STAGE_UPDATED',
                entity_type: 'lead',
                entity_id: id,
                details: `Lead moved to ${stage} stage`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.json({
                success: true,
                message: `Lead moved to ${stage} stage`,
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

            const lead = await leadService.assignLead(id, assigned_to);

            await createLeadAuditLog({
                action: 'LEAD_ASSIGNED',
                entity_type: 'lead',
                entity_id: id,
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
    },

    // ============================================
    // NEW ENDPOINTS - FULL LEAD DETAILS
    // ============================================

    /**
     * Get lead by ID with FULL requirements (flights, hotels, journey)
     */
    async getLeadByIdWithFullDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const lead = await leadService.getLeadByIdWithFullDetails(id);

            res.json({
                success: true,
                data: lead,
                message: 'Lead with full details retrieved successfully'
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Get all leads assigned to a specific RM with full details
     */
    async getLeadsByAssignedRM(req: Request, res: Response) {
        try {
            const { rmId } = req.params;

            if (!rmId) {
                return res.status(400).json({
                    success: false,
                    error: 'RM ID is required'
                });
            }

            const leads = await leadService.getLeadsByAssignedRM(rmId);

            res.json({
                success: true,
                data: leads,
                count: leads.length,
                message: `Retrieved ${leads.length} leads for RM`
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    // ============================================
    // NEW ENDPOINTS - FLIGHT REQUIREMENTS
    // ============================================

    /**
     * Add flight requirement to a lead
     */
    async addFlightRequirement(req: Request, res: Response) {
        try {
            const { leadId } = req.params;
            const payload: CreateFlightRequirementPayload = req.body;

            const flightRequirement = await leadService.addFlightRequirement(leadId, payload);

            await createLeadAuditLog({
                action: 'FLIGHT_REQUIREMENT_ADDED',
                entity_type: 'lead',
                entity_id: leadId,
                details: `Flight requirement added: ${payload.departure_city} to ${payload.arrival_city}`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.status(201).json({
                success: true,
                message: 'Flight requirement added successfully',
                data: flightRequirement
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Update flight requirement
     */
    async updateFlightRequirement(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const payload: Partial<CreateFlightRequirementPayload> = req.body;

            const flightRequirement = await leadService.updateFlightRequirement(id, payload);

            res.json({
                success: true,
                message: 'Flight requirement updated successfully',
                data: flightRequirement
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Delete flight requirement
     */
    async deleteFlightRequirement(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await leadService.deleteFlightRequirement(id);

            res.json({
                success: true,
                message: 'Flight requirement deleted successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Get flight requirements by lead ID
     */
    async getFlightRequirementsByLeadId(req: Request, res: Response) {
        try {
            const { leadId } = req.params;

            const flightRequirements = await leadService.getFlightRequirementsByLeadId(leadId);

            res.json({
                success: true,
                data: flightRequirements,
                count: flightRequirements.length
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    // ============================================
    // NEW ENDPOINTS - HOTEL REQUIREMENTS
    // ============================================

    /**
     * Add hotel requirement to a lead
     */
    async addHotelRequirement(req: Request, res: Response) {
        try {
            const { leadId } = req.params;
            const payload: CreateHotelRequirementPayload = req.body;

            const hotelRequirement = await leadService.addHotelRequirement(leadId, payload);

            await createLeadAuditLog({
                action: 'HOTEL_REQUIREMENT_ADDED',
                entity_type: 'lead',
                entity_id: leadId,
                details: `Hotel requirement added: ${payload.city}`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.status(201).json({
                success: true,
                message: 'Hotel requirement added successfully',
                data: hotelRequirement
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Update hotel requirement
     */
    async updateHotelRequirement(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const payload: Partial<CreateHotelRequirementPayload> = req.body;

            const hotelRequirement = await leadService.updateHotelRequirement(id, payload);

            res.json({
                success: true,
                message: 'Hotel requirement updated successfully',
                data: hotelRequirement
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Delete hotel requirement
     */
    async deleteHotelRequirement(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await leadService.deleteHotelRequirement(id);

            res.json({
                success: true,
                message: 'Hotel requirement deleted successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Get hotel requirements by lead ID
     */
    async getHotelRequirementsByLeadId(req: Request, res: Response) {
        try {
            const { leadId } = req.params;

            const hotelRequirements = await leadService.getHotelRequirementsByLeadId(leadId);

            res.json({
                success: true,
                data: hotelRequirements,
                count: hotelRequirements.length
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    // ============================================
    // NEW ENDPOINTS - JOURNEY DETAILS
    // ============================================

    /**
     * Upsert journey details for a lead
     */
    async upsertJourneyDetails(req: Request, res: Response) {
        try {
            const { leadId } = req.params;
            const payload: CreateJourneyDetailsPayload = req.body;

            const journeyDetails = await leadService.upsertJourneyDetails(leadId, payload);

            await createLeadAuditLog({
                action: 'JOURNEY_DETAILS_UPDATED',
                entity_type: 'lead',
                entity_id: leadId,
                details: `Journey details updated`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

            res.json({
                success: true,
                message: 'Journey details saved successfully',
                data: journeyDetails
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    },

    /**
     * Get journey details by lead ID
     */
    async getJourneyDetailsByLeadId(req: Request, res: Response) {
        try {
            const { leadId } = req.params;

            const journeyDetails = await leadService.getJourneyDetailsByLeadId(leadId);

            if (!journeyDetails) {
                return res.status(404).json({
                    success: false,
                    error: 'Journey details not found'
                });
            }

            res.json({
                success: true,
                data: journeyDetails
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
};