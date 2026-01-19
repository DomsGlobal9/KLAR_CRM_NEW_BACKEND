import { supabaseAdmin } from '../config';
import {
    Lead,
    LeadRequirements,
    LeadWithRequirements,
    LeadWithFullRequirements,
    LeadFlightRequirement,
    LeadHotelRequirement,
    LeadJourneyDetails,
    CreateLeadPayload,
    UpdateLeadPayload,
    LeadFilter,
    CreateFlightRequirementPayload,
    CreateHotelRequirementPayload,
    CreateJourneyDetailsPayload
} from '../interfaces/lead.interface';

export const leadRepository = {
    // ============================================
    // CORE LEAD OPERATIONS (Existing - Keep as is)
    // ============================================

    /**
     * Create a new lead with requirements
     */
    async createLeadWithRequirements(payload: CreateLeadPayload): Promise<LeadWithFullRequirements> {
        // Create lead
        const { data: leadData, error: leadError } = await supabaseAdmin
            .from('leads')
            .insert({
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                type: payload.type,
                source: payload.source,
                source_medium: payload.source_medium,
                assigned_to: payload.assigned_to,
                captured_from: payload.captured_from || 'manual',
                utm_source: payload.utm_source,
                utm_medium: payload.utm_medium,
                utm_campaign: payload.utm_campaign,
                utm_term: payload.utm_term,
                utm_content: payload.utm_content,
            })
            .select()
            .single();

        if (leadError) {
            throw new Error(`Failed to create lead: ${leadError.message}`);
        }

        const lead = leadData as Lead;
        let requirements: LeadRequirements | null = null;
        let flightRequirements: LeadFlightRequirement[] = [];
        let hotelRequirements: LeadHotelRequirement[] = [];
        let journeyDetails: LeadJourneyDetails | null = null;

        try {
            // Create basic requirements if any
            const hasBasicRequirements =
                payload.from_location || payload.to_location || payload.travel_date ||
                payload.return_date || payload.service_type || payload.services ||
                payload.sub_service || payload.needs_visa !== undefined ||
                payload.budget !== undefined || payload.travelers !== undefined ||
                payload.flight_class || payload.customer_category || payload.sub_category ||
                payload.company_name || payload.company_address || payload.company_details ||
                payload.gst_number || payload.lead_type || payload.notes;

            if (hasBasicRequirements) {
                const { data: reqData, error: reqError } = await supabaseAdmin
                    .from('lead_requirements')
                    .insert({
                        lead_id: lead.id,
                        from_location: payload.from_location,
                        to_location: payload.to_location,
                        travel_date: payload.travel_date,
                        return_date: payload.return_date,
                        service_type: payload.service_type,
                        services: payload.services,
                        sub_service: payload.sub_service,
                        needs_visa: payload.needs_visa,
                        budget: payload.budget,
                        travelers: payload.travelers,
                        flight_class: payload.flight_class,
                        customer_category: payload.customer_category,
                        sub_category: payload.sub_category,
                        company_name: payload.company_name,
                        company_address: payload.company_address,
                        company_details: payload.company_details,
                        gst_number: payload.gst_number,
                        lead_type: payload.lead_type,
                        notes: payload.notes
                    })
                    .select()
                    .single();

                if (reqError) throw new Error(`Failed to create requirements: ${reqError.message}`);
                requirements = reqData as LeadRequirements;
            }

            // Create flight requirements
            if (payload.flight_requirements && payload.flight_requirements.length > 0) {
                const flightInserts = payload.flight_requirements.map(flight => ({
                    lead_id: lead.id,
                    ...flight
                }));

                const { data: flightData, error: flightError } = await supabaseAdmin
                    .from('lead_flight_requirements')
                    .insert(flightInserts)
                    .select();

                if (flightError) throw new Error(`Failed to create flight requirements: ${flightError.message}`);
                flightRequirements = flightData as LeadFlightRequirement[];
            }

            // Create hotel requirements
            if (payload.hotel_requirements && payload.hotel_requirements.length > 0) {
                const hotelInserts = payload.hotel_requirements.map(hotel => ({
                    lead_id: lead.id,
                    ...hotel
                }));

                const { data: hotelData, error: hotelError } = await supabaseAdmin
                    .from('lead_hotel_requirements')
                    .insert(hotelInserts)
                    .select();

                if (hotelError) throw new Error(`Failed to create hotel requirements: ${hotelError.message}`);
                hotelRequirements = hotelData as LeadHotelRequirement[];
            }

            // Create journey details
            if (payload.journey_details) {
                const { data: journeyData, error: journeyError } = await supabaseAdmin
                    .from('lead_journey_details')
                    .insert({
                        lead_id: lead.id,
                        ...payload.journey_details
                    })
                    .select()
                    .single();

                if (journeyError) throw new Error(`Failed to create journey details: ${journeyError.message}`);
                journeyDetails = journeyData as LeadJourneyDetails;
            }

        } catch (error: any) {
            // Rollback: delete the lead if any related data fails
            await supabaseAdmin.from('leads').delete().eq('id', lead.id);
            throw error;
        }

        return {
            ...lead,
            requirements: requirements || undefined,
            flight_requirements: flightRequirements.length > 0 ? flightRequirements : undefined,
            hotel_requirements: hotelRequirements.length > 0 ? hotelRequirements : undefined,
            journey_details: journeyDetails || undefined
        };
    },






    /**
     * Get lead by ID with ALL requirements
     */
    async getLeadByIdWithFullRequirements(id: string): Promise<LeadWithFullRequirements | null> {
        // Get lead
        const { data: leadData, error: leadError } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (leadError) {
            if (leadError.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch lead: ${leadError.message}`);
        }

        const lead = leadData as Lead;

        // Get basic requirements
        const { data: reqData } = await supabaseAdmin
            .from('lead_requirements')
            .select('*')
            .eq('lead_id', id)
            .maybeSingle();

        // Get flight requirements
        const { data: flightData } = await supabaseAdmin
            .from('lead_flight_requirements')
            .select('*')
            .eq('lead_id', id)
            .eq('is_active', true);

        // Get hotel requirements
        const { data: hotelData } = await supabaseAdmin
            .from('lead_hotel_requirements')
            .select('*')
            .eq('lead_id', id)
            .eq('is_active', true);

        // Get journey details
        const { data: journeyData } = await supabaseAdmin
            .from('lead_journey_details')
            .select('*')
            .eq('lead_id', id)
            .maybeSingle();

        return {
            ...lead,
            requirements: reqData || undefined,
            flight_requirements: flightData && flightData.length > 0 ? flightData as LeadFlightRequirement[] : undefined,
            hotel_requirements: hotelData && hotelData.length > 0 ? hotelData as LeadHotelRequirement[] : undefined,
            journey_details: journeyData || undefined
        };
    },

    /**
     * Get lead by ID (backward compatible - basic requirements only)
     */
    async getLeadById(id: string): Promise<LeadWithRequirements | null> {
        const { data: leadData, error: leadError } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (leadError) {
            if (leadError.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch lead: ${leadError.message}`);
        }

        const lead = leadData as Lead;

        const { data: reqData } = await supabaseAdmin
            .from('lead_requirements')
            .select('*')
            .eq('lead_id', id)
            .maybeSingle();

        return {
            ...lead,
            requirements: reqData || undefined
        };
    },

    /**
     * Get lead by email with requirements
     */
    async getLeadByEmail(email: string): Promise<LeadWithRequirements | null> {
        const { data: leadData, error: leadError } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('email', email)
            .single();

        if (leadError) {
            if (leadError.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch lead by email: ${leadError.message}`);
        }

        const lead = leadData as Lead;

        const { data: reqData } = await supabaseAdmin
            .from('lead_requirements')
            .select('*')
            .eq('lead_id', lead.id)
            .maybeSingle();

        return {
            ...lead,
            requirements: reqData || undefined,
        };
    },

    /**
     * Get lead requirements by lead ID
     */
    async getLeadRequirements(leadId: string): Promise<LeadRequirements | null> {
        const { data, error } = await supabaseAdmin
            .from('lead_requirements')
            .select('*')
            .eq('lead_id', leadId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch lead requirements: ${error.message}`);
        }

        return data as LeadRequirements;
    },

    /**
     * Get all leads with basic requirements (backward compatible)
     */
    async getAllLeadsWithRequirements(filter: LeadFilter = {}): Promise<LeadWithRequirements[]> {
        let query = supabaseAdmin
            .from('lead_details')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (filter.search) {
            query = query.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%,phone.ilike.%${filter.search}%`);
        }
        if (filter.stage) query = query.eq('stage', filter.stage);
        if (filter.status) query = query.eq('status', filter.status);
        if (filter.customer_category) query = query.eq('customer_category', filter.customer_category);
        if (filter.assigned_to) query = query.eq('assigned_to', filter.assigned_to);
        if (filter.type) query = query.eq('type', filter.type);
        if (filter.date_from) query = query.gte('created_at', filter.date_from);
        if (filter.date_to) query = query.lte('created_at', filter.date_to);
        if (filter.limit) query = query.limit(filter.limit);
        if (filter.offset) query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);

        const { data, error } = await query;

        if (error) throw new Error(`Failed to fetch leads: ${error.message}`);

        return data.map((row: any) => {
            const {
                from_location, destination, travel_date, return_date,
                service_type, services, sub_service, needs_visa,
                budget, travelers, flight_class, customer_category,
                sub_category, company_name, company_address, company_details,
                gst_number, lead_type, requirements_notes,
                ...leadData
            } = row;

            const lead: Lead = {
                id: leadData.id,
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone,
                type: leadData.type,
                status: leadData.status,
                stage: leadData.stage,
                captured_from: leadData.captured_from,
                assigned_to: leadData.assigned_to,
                created_by: leadData.created_by,
                source: leadData.source,
                source_medium: leadData.source_medium,
                utm_source: leadData.utm_source,
                utm_medium: leadData.utm_medium,
                utm_campaign: leadData.utm_campaign,
                utm_term: leadData.utm_term,
                utm_content: leadData.utm_content,
                created_at: leadData.created_at,
                updated_at: leadData.updated_at
            };

            const hasRequirements =
                from_location || destination || travel_date || return_date ||
                service_type || services || sub_service || needs_visa !== undefined ||
                budget !== undefined || travelers !== undefined || flight_class ||
                customer_category || sub_category || company_name || company_address ||
                company_details || gst_number || lead_type || requirements_notes;

            return {
                ...lead,
                requirements: hasRequirements ? {
                    id: `${lead.id}_req`,
                    lead_id: lead.id,
                    from_location, destination, travel_date, return_date,
                    service_type, services, sub_service, needs_visa,
                    budget, travelers, flight_class, customer_category,
                    sub_category, company_name, company_address, company_details,
                    gst_number, lead_type,
                    notes: requirements_notes,
                    created_at: leadData.created_at,
                    updated_at: leadData.updated_at
                } : undefined
            };
        }) as LeadWithRequirements[];
    },

    /**
     * Update lead and requirements
     */
    async updateLeadWithRequirements(id: string, payload: UpdateLeadPayload): Promise<LeadWithRequirements> {
        const primaryFields: any = {};
        const requirementFields: any = {};

        const primaryFieldKeys = [
            'name', 'email', 'phone', 'type', 'status', 'stage',
            'assigned_to', 'source', 'source_medium'
        ];

        Object.keys(payload).forEach(key => {
            if (primaryFieldKeys.includes(key)) {
                primaryFields[key] = payload[key as keyof UpdateLeadPayload];
            } else {
                requirementFields[key] = payload[key as keyof UpdateLeadPayload];
            }
        });

        let leadUpdatePromise;
        if (Object.keys(primaryFields).length > 0) {
            leadUpdatePromise = supabaseAdmin
                .from('leads')
                .update(primaryFields)
                .eq('id', id)
                .select()
                .single();
        } else {
            leadUpdatePromise = supabaseAdmin
                .from('leads')
                .select('*')
                .eq('id', id)
                .single();
        }

        const { data: leadData, error: leadError } = await leadUpdatePromise;
        if (leadError) throw new Error(`Failed to update lead: ${leadError.message}`);

        const lead = leadData as Lead;
        const existingRequirements = await this.getLeadRequirements(id);
        let requirements: LeadRequirements | null = null;

        if (Object.keys(requirementFields).length > 0) {
            if (existingRequirements) {
                const { data: reqData, error: reqError } = await supabaseAdmin
                    .from('lead_requirements')
                    .update(requirementFields)
                    .eq('lead_id', id)
                    .select()
                    .single();

                if (reqError) throw new Error(`Failed to update requirements: ${reqError.message}`);
                requirements = reqData as LeadRequirements;
            } else {
                const { data: reqData, error: reqError } = await supabaseAdmin
                    .from('lead_requirements')
                    .insert({ lead_id: id, ...requirementFields })
                    .select()
                    .single();

                if (reqError) throw new Error(`Failed to create requirements: ${reqError.message}`);
                requirements = reqData as LeadRequirements;
            }
        } else {
            requirements = existingRequirements;
        }

        return {
            ...lead,
            requirements: requirements || undefined
        };
    },

    /**
     * Update or create lead requirements
     */
    async upsertLeadRequirements(leadId: string, payload: Partial<LeadRequirements>): Promise<LeadRequirements> {
        const existing = await this.getLeadRequirements(leadId);

        if (existing) {
            const { data, error } = await supabaseAdmin
                .from('lead_requirements')
                .update(payload)
                .eq('lead_id', leadId)
                .select()
                .single();

            if (error) throw new Error(`Failed to update requirements: ${error.message}`);
            return data as LeadRequirements;
        } else {
            const { data, error } = await supabaseAdmin
                .from('lead_requirements')
                .insert({ lead_id: leadId, ...payload })
                .select()
                .single();

            if (error) throw new Error(`Failed to create requirements: ${error.message}`);
            return data as LeadRequirements;
        }
    },

    /**
     * Delete lead (cascade will delete all requirements)
     */
    async deleteLead(id: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Failed to delete lead: ${error.message}`);
        return true;
    },

    /**
     * Get lead statistics
     */
    async getLeadStats(): Promise<any> {
        const { data: totalData, error: totalError } = await supabaseAdmin
            .from('leads')
            .select('id', { count: 'exact' });

        if (totalError) throw totalError;

        const { data: stageData, error: stageError } = await supabaseAdmin
            .from('leads')
            .select('stage');

        if (stageError) throw stageError;

        const { data: typeData, error: typeError } = await supabaseAdmin
            .from('leads')
            .select('type');

        if (typeError) throw typeError;

        const { data: statusData, error: statusError } = await supabaseAdmin
            .from('leads')
            .select('status');

        if (statusError) throw statusError;

        const { data: recentData, error: recentError } = await supabaseAdmin
            .from('leads')
            .select('id', { count: 'exact' })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        if (recentError) throw recentError;

        const { data: convertedData, error: convertedError } = await supabaseAdmin
            .from('leads')
            .select('id', { count: 'exact' })
            .eq('status', 'converted');

        if (convertedError) throw convertedError;

        const byStage: Record<string, number> = {};
        const byType: Record<string, number> = {};
        const byStatus: Record<string, number> = {};

        stageData?.forEach(lead => {
            byStage[lead.stage] = (byStage[lead.stage] || 0) + 1;
        });

        typeData?.forEach(lead => {
            byType[lead.type] = (byType[lead.type] || 0) + 1;
        });

        statusData?.forEach(lead => {
            byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
        });

        return {
            total: totalData?.length || 0,
            by_stage: byStage,
            by_type: byType,
            by_status: byStatus,
            recent_count: recentData?.length || 0,
            converted_count: convertedData?.length || 0
        };
    },

    // ============================================
    // NEW: FLIGHT REQUIREMENTS OPERATIONS
    // ============================================

    async addFlightRequirement(leadId: string, payload: CreateFlightRequirementPayload): Promise<LeadFlightRequirement> {
        const { data, error } = await supabaseAdmin
            .from('lead_flight_requirements')
            .insert({ lead_id: leadId, ...payload })
            .select()
            .single();

        if (error) throw new Error(`Failed to add flight requirement: ${error.message}`);
        return data as LeadFlightRequirement;
    },

    async updateFlightRequirement(id: string, payload: Partial<CreateFlightRequirementPayload>): Promise<LeadFlightRequirement> {
        const { data, error } = await supabaseAdmin
            .from('lead_flight_requirements')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update flight requirement: ${error.message}`);
        return data as LeadFlightRequirement;
    },

    async deleteFlightRequirement(id: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('lead_flight_requirements')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw new Error(`Failed to delete flight requirement: ${error.message}`);
        return true;
    },

    async getFlightRequirementsByLeadId(leadId: string): Promise<LeadFlightRequirement[]> {
        const { data, error } = await supabaseAdmin
            .from('lead_flight_requirements')
            .select('*')
            .eq('lead_id', leadId)
            .eq('is_active', true);

        if (error) throw new Error(`Failed to fetch flight requirements: ${error.message}`);
        return data as LeadFlightRequirement[];
    },

    // ============================================
    // NEW: HOTEL REQUIREMENTS OPERATIONS
    // ============================================

    async addHotelRequirement(leadId: string, payload: CreateHotelRequirementPayload): Promise<LeadHotelRequirement> {
        const { data, error } = await supabaseAdmin
            .from('lead_hotel_requirements')
            .insert({ lead_id: leadId, ...payload })
            .select()
            .single();

        if (error) throw new Error(`Failed to add hotel requirement: ${error.message}`);
        return data as LeadHotelRequirement;
    },

    async updateHotelRequirement(id: string, payload: Partial<CreateHotelRequirementPayload>): Promise<LeadHotelRequirement> {
        const { data, error } = await supabaseAdmin
            .from('lead_hotel_requirements')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update hotel requirement: ${error.message}`);
        return data as LeadHotelRequirement;
    },

    async deleteHotelRequirement(id: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('lead_hotel_requirements')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw new Error(`Failed to delete hotel requirement: ${error.message}`);
        return true;
    },

    async getHotelRequirementsByLeadId(leadId: string): Promise<LeadHotelRequirement[]> {
        const { data, error } = await supabaseAdmin
            .from('lead_hotel_requirements')
            .select('*')
            .eq('lead_id', leadId)
            .eq('is_active', true);

        if (error) throw new Error(`Failed to fetch hotel requirements: ${error.message}`);
        return data as LeadHotelRequirement[];
    },

    // ============================================
    // NEW: JOURNEY DETAILS OPERATIONS
    // ============================================

    async upsertJourneyDetails(leadId: string, payload: CreateJourneyDetailsPayload): Promise<LeadJourneyDetails> {
        const existing = await supabaseAdmin
            .from('lead_journey_details')
            .select('*')
            .eq('lead_id', leadId)
            .maybeSingle();

        if (existing.data) {
            const { data, error } = await supabaseAdmin
                .from('lead_journey_details')
                .update(payload)
                .eq('lead_id', leadId)
                .select()
                .single();

            if (error) throw new Error(`Failed to update journey details: ${error.message}`);
            return data as LeadJourneyDetails;
        } else {
            const { data, error } = await supabaseAdmin
                .from('lead_journey_details')
                .insert({ lead_id: leadId, ...payload })
                .select()
                .single();

            if (error) throw new Error(`Failed to create journey details: ${error.message}`);
            return data as LeadJourneyDetails;
        }
    },

    async getJourneyDetailsByLeadId(leadId: string): Promise<LeadJourneyDetails | null> {
        const { data, error } = await supabaseAdmin
            .from('lead_journey_details')
            .select('*')
            .eq('lead_id', leadId)
            .maybeSingle();

        if (error) throw new Error(`Failed to fetch journey details: ${error.message}`);
        return data as LeadJourneyDetails | null;
    },

    // ============================================
    // NEW: GET LEADS BY ASSIGNED RM
    // ============================================

    async getLeadsByAssignedRM(rmId: string): Promise<LeadWithFullRequirements[]> {
        const { data: leads, error } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('assigned_to', rmId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch leads by RM: ${error.message}`);

        const leadsWithRequirements = await Promise.all(
            leads.map(async (lead: Lead) => {
                return await this.getLeadByIdWithFullRequirements(lead.id);
            })
        );

        return leadsWithRequirements.filter(lead => lead !== null) as LeadWithFullRequirements[];
    }
};