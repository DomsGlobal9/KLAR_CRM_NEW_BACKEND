/**
 * Utility to map frontend lead data to backend/database format
 */
export class LeadDataMapper {
    
    /**
     * Transform frontend payload to database format
     */
    static mapFrontendToDatabase(payload: any): any {
        const mappedData = { ...payload };

        
        if (payload.destination) {
            mappedData.to_location = payload.destination;
            
        }

        
        if (payload.categories && Array.isArray(payload.categories)) {
            
            mappedData.service_details = {
                categories: payload.categories,
                service_id: payload.service_id,
                service_name: payload.service_name,
                service_category_id: payload.service_category_id,
                service_category_name: payload.service_category_name
            };

            
            const servicesArray: string[] = [];
            payload.categories.forEach((category: any) => {
                if (category.sub_services && Array.isArray(category.sub_services)) {
                    category.sub_services.forEach((sub: any) => {
                        if (sub.name) {
                            servicesArray.push(sub.name);
                        }
                    });
                }
            });

            if (servicesArray.length > 0) {
                mappedData.services = servicesArray.join(', ');
            }

            // Map the first sub-service ID if available
            if (payload.categories.length > 0 &&
                payload.categories[0].sub_services &&
                payload.categories[0].sub_services.length > 0) {
                mappedData.sub_service_id = payload.categories[0].sub_services[0].id;
            }

            // Map service category ID from first category
            if (payload.categories.length > 0 && payload.categories[0].category) {
                mappedData.sub_service_category_id = payload.categories[0].category.id;
            }
        }

        // Map inquiry_source to source if source is not provided
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

        // Remove frontend-specific fields that don't map to database
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

        return mappedData;
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

        // Extract service hierarchy from service_details
        if (lead.service_details && lead.service_details.categories) {
            frontendData.categories = lead.service_details.categories;
            frontendData.service_id = lead.service_details.service_id;
            frontendData.service_name = lead.service_details.service_name;
            frontendData.service_category_id = lead.service_details.service_category_id;
            frontendData.service_category_name = lead.service_details.service_category_name;
        }

        return frontendData;
    }

    /**
     * Prepare lead requirements for database insertion
     */
    static prepareRequirements(payload: any): any {
        const requirements: any = {};

        // Basic travel details
        requirements.from_location = payload.from_location;
        requirements.to_location = payload.destination; // Map here
        requirements.travel_date = payload.travel_date;
        requirements.return_date = payload.return_date;

        // Service details
        requirements.service_id = payload.service_id;
        requirements.service_type = payload.service_type || payload.service_name;
        requirements.sub_service = payload.sub_service;

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

        // Service hierarchy in JSON format
        if (payload.categories) {
            requirements.service_details = {
                categories: payload.categories,
                service_id: payload.service_id,
                service_name: payload.service_name,
                service_category_id: payload.service_category_id,
                service_category_name: payload.service_category_name
            };

            // Also store as comma-separated string
            const servicesArray: string[] = [];
            payload.categories.forEach((category: any) => {
                if (category.sub_services) {
                    category.sub_services.forEach((sub: any) => {
                        if (sub.name) {
                            servicesArray.push(sub.name);
                        }
                    });
                }
            });

            if (servicesArray.length > 0) {
                requirements.services = servicesArray.join(', ');
            }
        }

        // Set defaults
        requirements.pricing_type = 'fixed';
        requirements.pricing_units = 1;
        requirements.pricing_metadata = {};

        return requirements;
    }
}