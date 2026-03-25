export class LeadDataMapper {
    /**
     * Map frontend payload to database format
     */
    static mapFrontendToDatabase(payload: any): any {

        const mappedData = {

            name: payload.name || payload.fullName,
            email: payload.email || payload.emailAddress,
            phone: payload.phone || payload.phoneNumber,
            type: payload.type || 'travel',
            interest: payload.interest,


            status: payload.status || 'active',
            stage: payload.stage || 'lead',


            assigned_to: payload.assigned_to,
            captured_from: payload.captured_from || 'manual',


            source: payload.source || payload.inquirySource || payload.inquiry_source,
            source_medium: payload.source_medium || payload.inquirySource || payload.inquiry_source,
            utm_source: payload.utm_source,
            utm_medium: payload.utm_medium,
            utm_campaign: payload.utm_campaign,
            utm_term: payload.utm_term,
            utm_content: payload.utm_content,


            from_location: payload.from_location,
            destination: payload.destination,
            to_location: payload.destination || payload.country_city || payload.location,
            travel_date: payload.travel_date || payload.travelDate,
            return_date: payload.return_date || payload.returnDate,
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
            notes: payload.notes || payload.additionalNotes,


            service_selections: payload.service_selections,


            inquiry_source: payload.inquiry_source || payload.inquirySource,
            preferred_contact_method: payload.preferred_contact_method || payload.preferredContactMethod,
            budget_range: payload.budget_range || payload.budgetRange,
            timeline: payload.timeline || payload.travelTimeline,
            country_city: payload.country_city || payload.location,
            team_id: payload.team_id || payload.assignToTeam,
            team_name: payload.team_name,
            assigned_member_name: payload.assigned_member_name,


            _service_relationships: payload.service_selections
        };

        
        return mappedData;
    }

    /**
     * Prepare service relationships for database insertion
     */
    static prepareServiceRelationships(leadId: string, payload: any): Array<{
        service_id: string;
        sub_service_category_id: string;
        sub_service_id: string;
        selection_type: 'single' | 'multi';
        service_specific: Record<string, any>;
        attachments?: any[];
    }> {
        console.log("🔄 Preparing service relationships for lead:", leadId);

        const relationships: Array<{
            service_id: string;
            sub_service_category_id: string;
            sub_service_id: string;
            selection_type: 'single' | 'multi';
            service_specific: Record<string, any>;
            attachments?: any[];
        }> = [];

        if (!payload.service_selections || !Array.isArray(payload.service_selections)) {
            console.log("⚠️ No service_selections found in payload");
            return relationships;
        }

        // Use a Set to track unique combinations
        const uniqueKeys = new Set();

        payload.service_selections.forEach((serviceSelection: any) => {
            if (serviceSelection.categories && Array.isArray(serviceSelection.categories)) {
                serviceSelection.categories.forEach((category: any) => {

                    // Handle single selection
                    if (category.sub_service_single) {
                        const key = `${serviceSelection.service_id}|${category.category_id}|${category.sub_service_single}|single`;

                        if (!uniqueKeys.has(key)) {
                            uniqueKeys.add(key);
                            relationships.push({
                                service_id: serviceSelection.service_id,
                                sub_service_category_id: category.category_id,
                                sub_service_id: category.sub_service_single,
                                selection_type: 'single',
                                service_specific: serviceSelection.service_specific || {},
                                attachments: []
                            });
                        }
                    }

                    // Handle multiple selections
                    if (category.sub_service_ids && Array.isArray(category.sub_service_ids)) {
                        category.sub_service_ids.forEach((subServiceId: string) => {
                            const key = `${serviceSelection.service_id}|${category.category_id}|${subServiceId}|multi`;

                            if (!uniqueKeys.has(key)) {
                                uniqueKeys.add(key);
                                relationships.push({
                                    service_id: serviceSelection.service_id,
                                    sub_service_category_id: category.category_id,
                                    sub_service_id: subServiceId,
                                    selection_type: 'multi',
                                    service_specific: serviceSelection.service_specific || {},
                                    attachments: []
                                });
                            }
                        });
                    }
                });
            }
        });

        return relationships;
    }

    /**
     * Prepare requirements data
     */
    static prepareRequirements(payload: any): any {
        const requirementsData: any = {};

        const requirementFields = [
            'from_location', 'destination', 'to_location', 'travel_date', 'return_date',
            'service_type', 'services', 'sub_service', 'needs_visa',
            'budget', 'travelers', 'flight_class', 'customer_category',
            'sub_category', 'company_name', 'company_address', 'company_details',
            'gst_number', 'lead_type', 'notes'
        ];

        requirementFields.forEach(field => {
            if (payload[field] !== undefined) {
                requirementsData[field] = payload[field];
            }
        });

        // Map destination to to_location
        if (payload.destination) {
            requirementsData.to_location = payload.destination;
        }

        // Handle services array from frontend
        if (Array.isArray(payload.services)) {
            requirementsData.services = payload.services.join(', ');
        }

        return requirementsData;
    }

    /**
     * Format service relationships for frontend
     */
    static formatServiceRelationshipsForFrontend(
        relationships: any[],
        services: any[],
        categories: any[],
        subServices: any[]
    ): any[] {
        console.log("🔄 Formatting service relationships for frontend");
        console.log(`📊 Input: ${relationships.length} relationships, ${services.length} services, ${categories.length} categories, ${subServices.length} sub-services`);

        // Create maps for quick lookup
        const serviceMap = new Map();
        const categoryMap = new Map();
        const subServiceMap = new Map();

        // Populate maps
        services.forEach(service => {
            if (service && service.id) {
                serviceMap.set(service.id, service);
            }
        });

        categories.forEach(category => {
            if (category && category.id) {
                categoryMap.set(category.id, category);
            }
        });

        subServices.forEach(subService => {
            if (subService && subService.id) {
                subServiceMap.set(subService.id, subService);
            }
        });

        console.log(`🗺️ Map sizes: services=${serviceMap.size}, categories=${categoryMap.size}, subServices=${subServiceMap.size}`);


        const serviceGroups = new Map();

        relationships.forEach(rel => {
            if (!rel.service_id || !rel.sub_service_category_id || !rel.sub_service_id) {
                console.warn("⚠️ Skipping invalid relationship:", rel);
                return;
            }

            const serviceId = rel.service_id;

            if (!serviceGroups.has(serviceId)) {
                const service = serviceMap.get(serviceId);
                serviceGroups.set(serviceId, {
                    service_id: serviceId,
                    service_name: service?.name || 'Unknown Service',
                    service_type: service?.code || rel.service_specific?.service_type,
                    categories: [],
                    service_specific: rel.service_specific || {}
                });
            }

            const serviceGroup = serviceGroups.get(serviceId);
            const categoryId = rel.sub_service_category_id;
            const subServiceId = rel.sub_service_id;


            let categoryEntry = serviceGroup.categories.find((c: any) =>
                c.category_id === categoryId
            );

            if (!categoryEntry) {
                const category = categoryMap.get(categoryId);
                categoryEntry = {
                    category_id: categoryId,
                    category_name: category?.name || 'Unknown Category',
                    sub_service_ids: [],
                    sub_service_single: null
                };
                serviceGroup.categories.push(categoryEntry);
            }


            if (rel.selection_type === 'single') {
                categoryEntry.sub_service_single = subServiceId;

                if (!categoryEntry.sub_service_ids.includes(subServiceId)) {
                    categoryEntry.sub_service_ids.push(subServiceId);
                }
            } else if (rel.selection_type === 'multi') {
                if (!categoryEntry.sub_service_ids.includes(subServiceId)) {
                    categoryEntry.sub_service_ids.push(subServiceId);
                }
            }
        });

        const result = Array.from(serviceGroups.values());

        console.log(`✅ Formatted ${result.length} service groups`);
        result.forEach((group, idx) => {
            console.log(`  Service ${idx + 1}: ${group.service_name}, ${group.categories.length} categories`);
        });

        return result;
    }

    /**
     * Map database data to frontend format
     */
    static mapDatabaseToFrontend(lead: any, travelPlan?: any): any {

        const frontendLead = {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            type: lead.type,
            interest: lead.interest,

            // Status & tracking
            status: lead.status,
            stage: lead.stage,
            captured_from: lead.captured_from,

            // Assignment
            assigned_to: lead.assigned_to,
            assigned_user: lead.assigned_user,

            // Marketing attribution
            source: lead.source,
            source_medium: lead.source_medium,
            utm_source: lead.utm_source,
            utm_medium: lead.utm_medium,
            utm_campaign: lead.utm_campaign,
            utm_term: lead.utm_term,
            utm_content: lead.utm_content,

            // Timestamps
            created_at: lead.created_at,
            updated_at: lead.updated_at,

            // Requirements
            requirements: lead.requirements,

            // Service selections
            service_selections: lead.service_selections || [],
            service_relationships: lead.service_relationships || [],

            // Team info
            team_id: lead.team_id || (lead.assigned_user?.team_id),

            // Additional fields
            ...(lead.metadata || {}),

            travelPlan: travelPlan || null
        };

        // Map requirements fields to top level for convenience
        if (lead.requirements) {
            const requirementMappings = {
                from_location: lead.requirements.from_location,
                destination: lead.requirements.to_location || lead.requirements.destination,
                travel_date: lead.requirements.travel_date,
                return_date: lead.requirements.return_date,
                budget: lead.requirements.budget,
                travelers: lead.requirements.travelers,
                flight_class: lead.requirements.flight_class,
                customer_category: lead.requirements.customer_category,
                sub_category: lead.requirements.sub_category,
                company_name: lead.requirements.company_name,
                company_address: lead.requirements.company_address,
                company_details: lead.requirements.company_details,
                gst_number: lead.requirements.gst_number,
                lead_type: lead.requirements.lead_type,
                notes: lead.requirements.notes
            };

            Object.assign(frontendLead, requirementMappings);
        }

        // Add metadata fields to top level
        if (lead.metadata) {
            const metadataMappings = {
                budget_range: lead.metadata.budget_range,
                inquiry_source: lead.metadata.inquiry_source,
                preferred_contact_method: lead.metadata.preferred_contact_method,
                country_city: lead.metadata.country_city,
                timeline: lead.metadata.timeline,
                team_id: lead.metadata.team_id || frontendLead.team_id
            };

            Object.assign(frontendLead, metadataMappings);
        }

        return frontendLead;
    }

    /**
     * Map frontend payload to database format for UPDATE
     */
    static mapFrontendToDatabaseForUpdate(payload: any): any {
        console.log("🔄 Mapping frontend → db for UPDATE:", payload);

        const mapped: Record<string, any> = {};

        // ── Primary lead fields ─────────────────────────────────────
        const leadFields = [
            'name', 'email', 'phone', 'type',
            'status', 'stage', 'assigned_to',
            'source', 'source_medium',
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
        ];
        leadFields.forEach(f => {
            if (payload[f] !== undefined) mapped[f] = payload[f];
        });

        // ── Metadata / extra top-level fields ───────────────────────
        const metaFields = [
            'inquiry_source', 'preferred_contact_method',
            'budget_range', 'timeline', 'country_city',
            'team_id', 'team_name', 'assigned_member_name'
        ];
        const metadata: Record<string, any> = {};
        metaFields.forEach(f => {
            if (payload[f] !== undefined) metadata[f] = payload[f];
        });
        if (Object.keys(metadata).length > 0) {
            mapped.metadata = metadata;
        }

        // ── Requirements-ish fields ─────────────────────────────────
        const reqFields = [
            'from_location', 'destination', 'travel_date', 'return_date',
            'budget', 'travelers', 'flight_class',
            'customer_category', 'sub_category',
            'company_name', 'company_address', 'company_details', 'gst_number',
            'lead_type', 'notes'
        ];
        reqFields.forEach(f => {
            if (payload[f] !== undefined) {
                if (f === 'destination') {
                    mapped.to_location = payload[f];     // important mapping
                } else {
                    mapped[f] = payload[f];
                }
            }
        });

        // ── The most important part – service_selections ────────────
        if (payload.service_selections !== undefined) {
            mapped.service_selections = payload.service_selections;
            // Also keep the helper key the repo expects
            mapped._service_relationships = payload.service_selections;
        }

        // Remove undefined / null fields (optional but clean)
        Object.keys(mapped).forEach(k => {
            if (mapped[k] === undefined || mapped[k] === null) delete mapped[k];
        });

        return mapped;
    }
}