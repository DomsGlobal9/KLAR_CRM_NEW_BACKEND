export class LeadDataMapper {

    /**
     * Transform frontend payload to database format
     */
    static mapFrontendToDatabase(payload: any): any {
        const mappedData = { ...payload };

        // Map destination to to_location
        if (payload.destination) {
            mappedData.to_location = payload.destination;
        }

        // Map inquiry_source to source
        if (payload.inquiry_source && !payload.source) {
            mappedData.source = payload.inquiry_source;
            mappedData.source_medium = payload.inquiry_source;
        }

        // Set default values
        if (!mappedData.type) {
            mappedData.type = 'travel';
        }

        if (!mappedData.status) {
            mappedData.status = 'active';
        }

        if (!mappedData.stage) {
            mappedData.stage = 'lead';
        }

        if (!mappedData.captured_from) {
            mappedData.captured_from = 'manual';
        }

        // Remove frontend-specific fields that don't map directly to leads table
        delete mappedData.categories;
        delete mappedData.inquiry_source;
        delete mappedData.preferred_contact_method;
        delete mappedData.budget_range;
        delete mappedData.timeline;
        delete mappedData.country_city;
        delete mappedData.team_name;
        delete mappedData.assigned_member_name;
        delete mappedData.service_name;
        delete mappedData.service_category_name;
        delete mappedData.service_selections; // This will be handled separately

        return mappedData;
    }

    /**
     * Prepare service relationships from frontend payload
     */
    static prepareServiceRelationships(
        leadId: string,
        payload: any
    ): Array<{
        lead_id: string;
        service_id: string;
        sub_service_category_id: string;
        sub_service_id: string;
        selection_type: 'single' | 'multi';
        service_specific: Record<string, any>;
        attachments?: any[];
    }> {
        const relationships: any[] = [];

        if (!payload.service_selections || !Array.isArray(payload.service_selections)) {
            return relationships;
        }

        // Process each service selection
        payload.service_selections.forEach((serviceSelection: any) => {
            const { service_id, categories = [], service_specific = {} } = serviceSelection;

            // Process each category in the service
            categories.forEach((category: any) => {
                const { category_id, sub_service_ids = [], sub_service_single } = category;

                // Handle multi-select sub-services
                if (sub_service_ids.length > 0) {
                    sub_service_ids.forEach((sub_service_id: string) => {
                        relationships.push({
                            lead_id: leadId,
                            service_id,
                            sub_service_category_id: category_id,
                            sub_service_id,
                            selection_type: 'multi',
                            service_specific,
                            attachments: service_specific.attachments || []
                        });
                    });
                }

                // Handle single-select sub-service
                if (sub_service_single) {
                    relationships.push({
                        lead_id: leadId,
                        service_id,
                        sub_service_category_id: category_id,
                        sub_service_id: sub_service_single,
                        selection_type: 'single',
                        service_specific,
                        attachments: service_specific.attachments || []
                    });
                }
            });
        });

        return relationships;
    }

    /**
     * Prepare lead requirements for database insertion
     */
    static prepareRequirements(payload: any): any {
        const requirements: any = {};

        // Basic travel details
        requirements.from_location = payload.from_location;
        requirements.to_location = payload.destination;
        requirements.travel_date = payload.travel_date;
        requirements.return_date = payload.return_date;

        // Budget and travelers
        requirements.budget = payload.budget || 0;
        requirements.travelers = payload.travelers || 1;

        // Customer details
        requirements.customer_category = payload.customer_category || 'individual';
        requirements.sub_category = payload.sub_category;

        // Corporate details
        requirements.company_name = payload.company_name;
        requirements.company_address = payload.company_address;
        requirements.company_details = payload.company_details;
        requirements.gst_number = payload.gst_number;

        // Additional info
        requirements.needs_visa = payload.needs_visa || false;
        requirements.flight_class = payload.flight_class;
        requirements.lead_type = payload.lead_type;
        requirements.notes = payload.notes;

        // Remove service-related fields from requirements
        // (they'll be stored in lead_service_relationships)
        delete requirements.service_id;
        delete requirements.service_type;
        delete requirements.services;
        delete requirements.sub_service;
        delete requirements.service_details;

        // Set defaults
        requirements.pricing_type = 'fixed';
        requirements.pricing_units = 1;
        requirements.pricing_metadata = {};

        return requirements;
    }

    /**
     * Transform database data to frontend format
     */
    static mapDatabaseToFrontend(lead: any): any {
        const frontendData = { ...lead };

        // Map to_location -> destination for frontend
        if (lead.to_location) {
            frontendData.destination = lead.to_location;
        }

        return frontendData;
    }

    /**
     * Format service relationships for frontend response
     */
    static formatServiceRelationshipsForFrontend(
        relationships: any[],
        services: any[],
        categories: any[],
        subServices: any[]
    ): any {
        // Group relationships by service
        const serviceMap = new Map();

        relationships.forEach(rel => {
            const serviceId = rel.service_id;

            if (!serviceMap.has(serviceId)) {
                const service = services.find(s => s.id === serviceId);
                serviceMap.set(serviceId, {
                    service_id: serviceId,
                    service_name: service?.name || 'Unknown Service',
                    service_type: service?.metadata?.service_type,
                    categories: []
                });
            }

            const serviceEntry = serviceMap.get(serviceId);
            const categoryId = rel.sub_service_category_id;

            // Find or create category entry
            let categoryEntry = serviceEntry.categories.find((c: any) => c.category_id === categoryId);

            if (!categoryEntry) {
                const category = categories.find(c => c.id === categoryId);
                categoryEntry = {
                    category_id: categoryId,
                    category_name: category?.name || 'Unknown Category',
                    sub_service_ids: [],
                    sub_service_single: ''
                };
                serviceEntry.categories.push(categoryEntry);
            }

            // Add sub-service based on selection type
            const subService = subServices.find(s => s.id === rel.sub_service_id);
            if (rel.selection_type === 'single') {
                categoryEntry.sub_service_single = rel.sub_service_id;
            } else {
                if (!categoryEntry.sub_service_ids.includes(rel.sub_service_id)) {
                    categoryEntry.sub_service_ids.push(rel.sub_service_id);
                }
            }

            // Add service-specific fields
            if (rel.service_specific && Object.keys(rel.service_specific).length > 0) {
                serviceEntry.service_specific = {
                    ...serviceEntry.service_specific,
                    ...rel.service_specific
                };
            }
        });

        return Array.from(serviceMap.values());
    }
}