import { supabaseAdmin } from '../config';
import {
    Lead,
    LeadRequirements,
    LeadWithRequirements,
    CreateLeadPayload,
    UpdateLeadPayload,
    LeadFilter
} from '../interfaces/lead.interface';
import { LeadDataMapper } from '../utils/lead-data-mapper';
import { AuthRepository } from './auth.repository';

export const leadRepository = {

    /**
     * Check whether a lead exists by ID
     */
    async isLeadExists(leadId: string): Promise<boolean> {
        const { data, error } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('id', leadId)
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to check lead existence: ${error.message}`);
        }

        return !!data;
    },


    /**
     * Create a new lead with requirements
     */
    async createLeadWithRequirements(payload: any): Promise<LeadWithRequirements> {
        console.log("🗄️ Repository payload:", JSON.stringify(payload, null, 2));

        /**
         * Create lead first
         */
        const { data: leadData, error: leadError } = await supabaseAdmin
            .from('leads')
            .insert({
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                type: payload.type || 'travel',
                status: payload.status || 'active',
                stage: payload.stage || 'lead',
                captured_from: payload.captured_from || 'manual',
                assigned_to: payload.assigned_to,
                created_by: payload.created_by,
                source: payload.source || payload.inquiry_source,
                source_medium: payload.source_medium || payload.inquiry_source,
                utm_source: payload.utm_source,
                utm_medium: payload.utm_medium,
                utm_campaign: payload.utm_campaign,
                utm_term: payload.utm_term,
                utm_content: payload.utm_content,
            })
            .select()
            .single();

        if (leadError) {
            console.error("❌ Lead creation error:", leadError);
            throw new Error(`Failed to create lead: ${leadError.message}`);
        }

        const lead = leadData as Lead;
        console.log("✅ Lead created with ID:", lead.id);

        /**
         * Create requirements - use to_location (mapped from destination)
         */
        const { data: reqData, error: reqError } = await supabaseAdmin
            .from('lead_requirements')
            .insert({
                lead_id: lead.id,

                /**
                 * Service fields
                 */
                service_id: payload.service_id,
                sub_service_category_id: payload.sub_service_category_id,
                sub_service_id: payload.sub_service_id,
                service_type: payload.service_type,
                services: payload.services,
                sub_service: payload.sub_service,
                service_details: payload.service_details,

                /**
                 * Location - CRITICAL: Use to_location (mapped from frontend's destination)
                 */
                from_location: payload.from_location,
                to_location: payload.to_location || payload.destination,

                /**
                 * Travel dates
                 */
                travel_date: payload.travel_date,
                return_date: payload.return_date,

                /**
                 * Travel details
                 */
                needs_visa: payload.needs_visa || false,
                budget: payload.budget || 0,
                travelers: payload.travelers || 1,
                flight_class: payload.flight_class,

                /**
                 * Customer info
                 */
                customer_category: payload.customer_category || 'individual',
                sub_category: payload.sub_category,

                /**
                 * Corporate fields
                 */
                company_name: payload.company_name,
                company_address: payload.company_address,
                company_details: payload.company_details,
                gst_number: payload.gst_number,

                /**
                 * Additional
                 */
                lead_type: payload.lead_type,
                notes: payload.notes,

                /**
                 * Defaults
                 */
                pricing_type: payload.pricing_type || 'fixed',
                pricing_units: payload.pricing_units || 1,
                pricing_metadata: payload.pricing_metadata || {},
            })
            .select()
            .single();

        if (reqError) {
            console.error("❌ Requirements creation error:", reqError);

            await supabaseAdmin.from('leads').delete().eq('id', lead.id);
            throw new Error(`Failed to create lead requirements: ${reqError.message}`);
        }

        console.log("✅ Requirements created successfully");
        const requirements = reqData as LeadRequirements;

        return {
            ...lead,
            requirements: requirements
        };
    },

    /**
     * Get lead by ID with requirements
     */
    async getLeadById(id: string): Promise<LeadWithRequirements | null> {
        const { data: leadData, error: leadError } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (leadError) {
            if (leadError.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch lead: ${leadError.message}`);
        }

        let assignedToName: string | null = null;

        if (leadData.assigned_to) {
            assignedToName = await AuthRepository.getUsernameById(
                leadData.assigned_to
            );
        }

        const { data: reqData } = await supabaseAdmin
            .from('lead_requirements')
            .select('*')
            .eq('lead_id', id)
            .maybeSingle();

        return {
            ...leadData,
            assigned_to: assignedToName,
            requirements: reqData || undefined
        };
    },


    /**
     * Get lead by email with requirements
     */
    async getLeadByEmail(email: string): Promise<LeadWithRequirements | null> {

        /**
         * Get lead by email
         */
        const { data: leadData, error: leadError } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('email', email)
            .single();

        if (leadError) {
            if (leadError.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch lead by email: ${leadError.message}`);
        }

        const lead = leadData as Lead;

        /**
         * Get Lead Details by email id
         * If email found then will lead can get
         */
        const { data: reqData } = await supabaseAdmin
            .from('lead_requirements')
            .select('*')
            .eq('lead_id', lead.id)
            .maybeSingle();

        const requirements = reqData as LeadRequirements | null;

        return {
            ...lead,
            requirements: requirements || undefined,
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
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch lead requirements: ${error.message}`);
        }

        return data as LeadRequirements;
    },

    /**
     * Get all leads with requirements
     */
    async getAllLeadsWithRequirements(filter: LeadFilter = {}): Promise<LeadWithRequirements[]> {

        let query = supabaseAdmin
            .from('lead_details')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter.search) {
            query = query.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%,phone.ilike.%${filter.search}%`);
        }

        if (filter.stage) {
            query = query.eq('stage', filter.stage);
        }

        if (filter.status) {
            query = query.eq('status', filter.status);
        }

        if (filter.customer_category) {
            query = query.eq('customer_category', filter.customer_category);
        }

        if (filter.assigned_to) {
            query = query.eq('assigned_to', filter.assigned_to);
        }

        if (filter.type) {
            query = query.eq('type', filter.type);
        }

        if (filter.date_from) {
            query = query.gte('created_at', filter.date_from);
        }

        if (filter.date_to) {
            query = query.lte('created_at', filter.date_to);
        }

        if (filter.limit) {
            query = query.limit(filter.limit);
        }

        if (filter.offset) {
            query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch leads: ${error.message}`);
        }

        // Create an array to store the leads with usernames
        const leadsWithUsernames = await Promise.all(data.map(async (row: any) => {
            const destination = row.to_location || row.destination;

            const {
                to_location,
                from_location, travel_date, return_date,
                service_type, services, sub_service, needs_visa,
                budget, travelers, flight_class, customer_category,
                sub_category, company_name, company_address, company_details,
                gst_number, lead_type, requirements_notes,
                ...leadData
            } = row;

            // Get username for assigned_to user if it exists
            let assignedToUsername = null;
            if (leadData.assigned_to) {
                assignedToUsername = await AuthRepository.getUsernameById(leadData.assigned_to);
                console.log("Assigned to data:  ", assignedToUsername);
            }

            const lead: Lead = {
                id: leadData.id,
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone,
                type: leadData.type,
                status: leadData.status,
                stage: leadData.stage,
                captured_from: leadData.captured_from,
                assigned_to: assignedToUsername || '',
                // assigned_to: leadData.assigned_to,
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
                destination: destination,
                requirements: hasRequirements ? {
                    id: `${lead.id}_req`,
                    lead_id: lead.id,
                    from_location,
                    to_location: destination,
                    destination: destination,
                    travel_date,
                    return_date,
                    service_type,
                    services,
                    sub_service,
                    needs_visa,
                    budget,
                    travelers,
                    flight_class,
                    customer_category,
                    sub_category,
                    company_name,
                    company_address,
                    company_details,
                    gst_number,
                    lead_type,
                    notes: requirements_notes,
                    created_at: leadData.created_at,
                    updated_at: leadData.updated_at
                } : undefined
            };
        }));

        return leadsWithUsernames as LeadWithRequirements[];
    },

    /**
     * Get leads with minimal fields
     * @param filter 
     * @returns 
     */
    async getLeadsList(filter: LeadFilter = {}) {
        let query = supabaseAdmin
            .from('leads')
            .select('id, name, source, stage, assigned_to')
            .order('created_at', { ascending: false });

        if (filter.search) {
            query = query.ilike('name', `%${filter.search}%`);
        }

        if (filter.stage) {
            query = query.eq('stage', filter.stage);
        }

        if (filter.assigned_to) {
            query = query.eq('assigned_to', filter.assigned_to);
        }

        if (filter.limit) {
            query = query.limit(filter.limit);
        }

        if (filter.offset !== undefined) {
            query = query.range(
                filter.offset,
                filter.offset + (filter.limit || 10) - 1
            );
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch leads: ${error.message}`);
        }

        if (!data) return [];

        const leadsWithUsernames = await Promise.all(
            data.map(async (lead) => {
                if (!lead.assigned_to) {
                    return { ...lead, assigned_to: null };
                }

                const username = await AuthRepository.getUsernameById(lead.assigned_to);

                return {
                    ...lead,
                    assigned_to: username,
                };
            })
        );

        return leadsWithUsernames;
    },



    /**
     * Update lead and requirements
     */
    async updateLeadWithRequirements(id: string, payload: UpdateLeadPayload): Promise<boolean> {

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

        if (leadError) {
            throw new Error(`Failed to update lead: ${leadError.message}`);
        }

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

                if (reqError) {
                    throw new Error(`Failed to update lead requirements: ${reqError.message}`);
                }

                requirements = reqData as LeadRequirements;
            } else {

                const { data: reqData, error: reqError } = await supabaseAdmin
                    .from('lead_requirements')
                    .insert({
                        lead_id: id,
                        ...requirementFields
                    })
                    .select()
                    .single();

                if (reqError) {
                    throw new Error(`Failed to create lead requirements: ${reqError.message}`);
                }

                requirements = reqData as LeadRequirements;
            }
        } else {
            requirements = existingRequirements;
        }

        return true;
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

            if (error) {
                throw new Error(`Failed to update lead requirements: ${error.message}`);
            }

            return data as LeadRequirements;
        } else {

            const { data, error } = await supabaseAdmin
                .from('lead_requirements')
                .insert({
                    lead_id: leadId,
                    ...payload
                })
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to create lead requirements: ${error.message}`);
            }

            return data as LeadRequirements;
        }
    },

    /**
     * Delete lead (cascade will delete requirements)
     */
    async deleteLead(id: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete lead: ${error.message}`);
        }

        return true;
    },

    /**
     * Get lead statistics (using leads table only)
     */
    async getLeadStats(leadId?: string): Promise<any> {
        try {
            if (leadId) {
                const { data: leadData, error: leadError } = await supabaseAdmin
                    .from('leads')
                    .select('*')
                    .eq('id', leadId)
                    .single();

                if (leadError) {
                    throw new Error(`Lead with ID ${leadId} not found`);
                }

                const { data: preferencesData } = await supabaseAdmin
                    .from('user_itenary_preferences_summary')
                    .select('*')
                    .eq('lead_id', leadId)
                    .maybeSingle();

                return {
                    lead_id: leadData.id,
                    name: leadData.name,
                    email: leadData.email,
                    stage: leadData.stage,
                    type: leadData.type,
                    status: leadData.status,
                    created_at: leadData.created_at,
                    has_itinerary_preferences: !!preferencesData,
                    preferences_summary: preferencesData || null,
                    lead_details: leadData
                };
            }

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

            const { data: leadsWithPreferences } = await supabaseAdmin
                .from('user_itenary_preferences_summary')
                .select('lead_id');

            const leadsWithPreferencesCount = leadsWithPreferences?.length || 0;
            const leadsWithoutPreferences = (totalData?.length || 0) - leadsWithPreferencesCount;

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
                converted_count: convertedData?.length || 0,
                with_itinerary_preferences: leadsWithPreferencesCount,
                without_itinerary_preferences: leadsWithoutPreferences,
                leads_with_preferences_percentage: totalData?.length ?
                    Math.round((leadsWithPreferencesCount / totalData.length) * 100) : 0
            };
        } catch (error) {
            console.error('Error in getLeadStats repository:', error);
            throw error;
        }
    },

    /**
     * Update ONLY lead stage (optimized for stage changes)
     */
    async updateLeadStageOnly(
        leadId: string,
        stageId: string
    ): Promise<boolean> {

        const start = performance.now();

        const { error } = await supabaseAdmin
            .from('leads')
            .update({
                stage_id: stageId,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId);

        console.log(
            `⏱️ updateLeadStageOnly: ${(performance.now() - start).toFixed(2)} ms`
        );

        if (error) {
            console.error('Lead stage update error:', {
                leadId,
                stageId,
                error: error.message
            });
            throw new Error(`Failed to update lead stage: ${error.message}`);
        }

        return true;
    },

    /**
     * Create lead service relationships
     */
    async createLeadServiceRelationships(
        leadId: string,
        relationships: Array<{
            service_id: string;
            sub_service_category_id: string;
            sub_service_id: string;
            selection_type: 'single' | 'multi';
            service_specific: Record<string, any>;
            attachments?: any[];
        }>
    ): Promise<boolean> {
        if (!relationships || relationships.length === 0) {
            return true;
        }

        const relationshipsToInsert = relationships.map(rel => ({
            lead_id: leadId,
            ...rel,
            attachments: rel.attachments || []
        }));

        const { error } = await supabaseAdmin
            .from('lead_service_relationships')
            .insert(relationshipsToInsert);

        if (error) {
            console.error('Failed to create service relationships:', error);
            throw new Error(`Failed to create service relationships: ${error.message}`);
        }

        return true;
    },

    /**
     * Get service relationships for a lead
     */
    async getLeadServiceRelationships(leadId: string): Promise<any[]> {
        const { data, error } = await supabaseAdmin
            .from('lead_service_relationships')
            .select(`
                *,
                service:service_id(name, code, metadata),
                category:sub_service_category_id(name, code, input_type),
                sub_service:sub_service_id(name, code, description)
            `)
            .eq('lead_id', leadId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Failed to fetch service relationships:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Update lead service relationships (delete old, insert new)
     */
    async updateLeadServiceRelationships(
        leadId: string,
        relationships: Array<{
            service_id: string;
            sub_service_category_id: string;
            sub_service_id: string;
            selection_type: 'single' | 'multi';
            service_specific: Record<string, any>;
            attachments?: any[];
        }>
    ): Promise<boolean> {
        // Delete existing relationships
        const { error: deleteError } = await supabaseAdmin
            .from('lead_service_relationships')
            .delete()
            .eq('lead_id', leadId);

        if (deleteError) {
            console.error('Failed to delete old relationships:', deleteError);
            throw new Error(`Failed to update service relationships: ${deleteError.message}`);
        }

        // Insert new relationships
        if (relationships && relationships.length > 0) {
            return await this.createLeadServiceRelationships(leadId, relationships);
        }

        return true;
    },

    /**
     * Create lead with full details including service relationships
     */
    async createLeadWithFullDetails(payload: any): Promise<LeadWithRequirements> {
        console.log("🗄️ Creating lead with full details:", payload);

        // 1. Create lead
        const leadData = LeadDataMapper.mapFrontendToDatabase(payload);

        const { data: lead, error: leadError } = await supabaseAdmin
            .from('leads')
            .insert({
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone,
                type: leadData.type || 'travel',
                status: leadData.status || 'active',
                stage: leadData.stage || 'lead',
                captured_from: leadData.captured_from || 'manual',
                assigned_to: leadData.assigned_to,
                created_by: leadData.created_by,
                source: leadData.source,
                source_medium: leadData.source_medium,
                utm_source: leadData.utm_source,
                utm_medium: leadData.utm_medium,
                utm_campaign: leadData.utm_campaign,
                utm_term: leadData.utm_term,
                utm_content: leadData.utm_content,
                metadata: {
                    inquiry_source: payload.inquiry_source,
                    preferred_contact_method: payload.preferred_contact_method,
                    country_city: payload.country_city,
                    team_id: payload.team_id,
                    budget_range: payload.budget_range,
                    timeline: payload.timeline,
                    ...(payload.metadata || {})
                }
            })
            .select()
            .single();

        if (leadError) {
            console.error("❌ Lead creation error:", leadError);
            throw new Error(`Failed to create lead: ${leadError.message}`);
        }

        console.log("✅ Lead created with ID:", lead.id);

        // 2. Create lead requirements
        const requirementsData = LeadDataMapper.prepareRequirements(payload);

        const { data: requirements, error: reqError } = await supabaseAdmin
            .from('lead_requirements')
            .insert({
                lead_id: lead.id,
                ...requirementsData
            })
            .select()
            .single();

        if (reqError) {
            console.error("❌ Requirements creation error:", reqError);

            // Rollback: delete the lead
            await supabaseAdmin.from('leads').delete().eq('id', lead.id);
            throw new Error(`Failed to create lead requirements: ${reqError.message}`);
        }

        console.log("✅ Requirements created successfully");

        // 3. Create service relationships
        if (payload.service_selections && payload.service_selections.length > 0) {
            const relationships = LeadDataMapper.prepareServiceRelationships(lead.id, payload);

            try {
                await this.createLeadServiceRelationships(lead.id, relationships);
                console.log("✅ Service relationships created successfully");
            } catch (error) {
                console.error("❌ Service relationships error:", error);
                // Optional: decide whether to rollback or continue
            }
        }

        // 4. Get complete lead data with relationships
        const completeLead = await this.getLeadWithFullDetails(lead.id);

        return completeLead;
    },

    /**
     * Get lead with full details including service relationships
     */
    async getLeadWithFullDetails(leadId: string): Promise<LeadWithRequirements> {
        // Get lead
        const { data: leadData, error: leadError } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (leadError) {
            throw new Error(`Failed to fetch lead: ${leadError.message}`);
        }

        // Get assigned user info if exists
        let assignedToInfo = null;
        if (leadData.assigned_to) {
            assignedToInfo = await AuthRepository.getUsernameById(leadData.assigned_to);
        }

        // Get requirements
        const { data: reqData } = await supabaseAdmin
            .from('lead_requirements')
            .select('*')
            .eq('lead_id', leadId)
            .maybeSingle();

        // Get service relationships
        const serviceRelationships = await this.getLeadServiceRelationships(leadId);

        // Format for frontend
        const formattedRelationships = LeadDataMapper.formatServiceRelationshipsForFrontend(
            serviceRelationships,
            serviceRelationships.map(r => r.service),
            serviceRelationships.map(r => r.category),
            serviceRelationships.map(r => r.sub_service)
        );

        return {
            ...leadData,
            assigned_to: assignedToInfo,
            requirements: reqData || undefined,
            service_relationships: serviceRelationships,
            service_selections: formattedRelationships,
            metadata: leadData.metadata || {}
        };
    },

    /**
     * Update lead with full details including service relationships
     */
    async updateLeadWithFullDetails(
        leadId: string,
        payload: any
    ): Promise<boolean> {
        console.log("🗄️ Updating lead with full details:", leadId);

        // 1. Update lead
        const leadData = LeadDataMapper.mapFrontendToDatabase(payload);

        const { error: leadError } = await supabaseAdmin
            .from('leads')
            .update({
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone,
                type: leadData.type,
                status: leadData.status,
                stage: leadData.stage,
                assigned_to: leadData.assigned_to,
                source: leadData.source,
                source_medium: leadData.source_medium,
                metadata: {
                    inquiry_source: payload.inquiry_source,
                    preferred_contact_method: payload.preferred_contact_method,
                    country_city: payload.country_city,
                    team_id: payload.team_id,
                    budget_range: payload.budget_range,
                    timeline: payload.timeline,
                    ...(payload.metadata || {})
                },
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId);

        if (leadError) {
            console.error("❌ Lead update error:", leadError);
            throw new Error(`Failed to update lead: ${leadError.message}`);
        }

        console.log("✅ Lead updated successfully");

        // 2. Update requirements
        const requirementsData = LeadDataMapper.prepareRequirements(payload);

        const { data: existingReq } = await supabaseAdmin
            .from('lead_requirements')
            .select('id')
            .eq('lead_id', leadId)
            .maybeSingle();

        if (existingReq) {
            // Update existing requirements
            const { error: reqError } = await supabaseAdmin
                .from('lead_requirements')
                .update(requirementsData)
                .eq('lead_id', leadId);

            if (reqError) {
                console.error("❌ Requirements update error:", reqError);
                throw new Error(`Failed to update requirements: ${reqError.message}`);
            }
        } else {
            // Create new requirements
            const { error: reqError } = await supabaseAdmin
                .from('lead_requirements')
                .insert({
                    lead_id: leadId,
                    ...requirementsData
                });

            if (reqError) {
                console.error("❌ Requirements creation error:", reqError);
                throw new Error(`Failed to create requirements: ${reqError.message}`);
            }
        }

        console.log("✅ Requirements updated successfully");

        // 3. Update service relationships
        if (payload.service_selections) {
            const relationships = LeadDataMapper.prepareServiceRelationships(leadId, payload);
            await this.updateLeadServiceRelationships(leadId, relationships);
            console.log("✅ Service relationships updated successfully");
        }

        return true;
    },

};