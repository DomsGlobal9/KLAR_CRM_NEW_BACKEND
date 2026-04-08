import axios from 'axios';
import { envConfig } from '../config';

class TravelPlanService {
    private readonly PLAN_API_URL = `${envConfig.S3_SERVER_URL}/plan`;

    async generateTravelPlan(leadData: any): Promise<any> {
        try {
            const travelRequest = this.prepareTravelRequest(leadData);
            console.log("@@@@@@@@@@@@@@@@ The travel request we get\n", JSON.stringify(travelRequest, null, 2));

            const response = await axios.post(
                this.PLAN_API_URL,
                travelRequest,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('❌ Travel plan generation error:', error.message);
            if (error.response) {
                console.error('API Error Response:', error.response.data);
            }
            throw new Error(`Failed to generate travel plan: ${error.message}`);
        }
    }

    private prepareTravelRequest(leadData: any): any {

        console.log("############# LEad data we get", JSON.stringify(leadData, null, 2));
        const budget = this.extractBudget(leadData);
        const selectedPlanType = this.extractTravelType(leadData);
        const from = this.extractFromLocation(leadData);
        const to = this.extractDestination(leadData);
        const travelers = leadData.travelers ||
            leadData.service_specific?.guests ||
            leadData.serviceSpecific?.guests ||
            1;

        
        const request: any = {
            from: from,
            to: to,
            days: this.extractDuration(leadData),
            budget: budget,
            travel_type: selectedPlanType,
        };

        request.lead_data = {
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            travelers: travelers,
            preferred_contact: leadData.preferred_contact_method,
            inquiry_source: leadData.inquiry_source,
            country_city: leadData.country_city,
            selected_plan_type: selectedPlanType,
        };

        const services = leadData.service_selections || leadData.serviceSelections;
        if (services && services.length > 0) {
            request.services = services.map((service: any) => ({
                name: service.service_name || service.serviceName,
                type: service.service_type || service.serviceType,
                categories: service.categories,
                specific: service.service_specific || service.serviceSpecific,
            }));
        }

        if (leadData.metadata) {
            request.metadata = leadData.metadata;
        }

        if (leadData.notes) {
            request.notes = leadData.notes;
        }

        return request;
    }

    private extractFromLocation(leadData: any): string {
        return leadData.from_location ||
            leadData.service_specific?.departurePort ||
            leadData.service_specific?.pickupLocation ||
            leadData.serviceSpecific?.pickupLocation ||
            leadData.country_city?.split(',')[0] ||
            'Not specified';
    }

    private extractDestination(leadData: any): string {
        return leadData.destination ||
            leadData.country_city ||
            leadData.service_specific?.dropLocation ||
            leadData.serviceSpecific?.dropLocation ||
            leadData.service_specific?.arrivalPort ||
            'Not specified';
    }

    private extractDuration(leadData: any): number {

        if (leadData.notes) {
            const durationMatch = leadData.notes.match(/Duration:\s*(\d+)\s*days?/i);
            if (durationMatch) return parseInt(durationMatch[1]);
        }


        if (leadData.service_specific?.duration) return leadData.service_specific.duration;
        if (leadData.serviceSpecific?.duration) return leadData.serviceSpecific.duration;


        if (leadData.travel_date && leadData.return_date) {
            const start = new Date(leadData.travel_date);
            const end = new Date(leadData.return_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }


        if (leadData.service_specific?.charterStart && leadData.service_specific?.charterEnd) {
            const start = new Date(leadData.service_specific.charterStart);
            const end = new Date(leadData.service_specific.charterEnd);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }

        return 5;
    }

    private extractBudget(leadData: any): string {
        // Handle string budget from payload
        const budgetValue = leadData.budget || leadData.budget_range;

        if (budgetValue) {
            if (typeof budgetValue === 'string') {
                const budgetLower = budgetValue.toLowerCase();
                if (budgetLower.includes('low') || budgetLower.includes('0-')) return 'low';
                if (budgetLower.includes('mid')) return 'mid';
                if (budgetLower.includes('high')) return 'high';

                // Parse numeric value from string like "70000"
                const numericBudget = parseInt(budgetValue);
                if (!isNaN(numericBudget)) {
                    if (numericBudget < 30000) return 'low';
                    if (numericBudget < 100000) return 'mid';
                    return 'high';
                }
            } else if (typeof budgetValue === 'number') {
                if (budgetValue < 30000) return 'low';
                if (budgetValue < 100000) return 'mid';
                return 'high';
            }
        }

        // Check notes for budget hints
        if (leadData.notes) {
            if (leadData.notes.includes('₹45,000 - ₹75,000')) return 'mid';
            if (leadData.notes.includes('₹0 - ₹78000')) return 'low';
        }

        return 'mid';
    }


    private extractTravelType(leadData: any): string {
        // Use selectedPlanType if available (from payload)
        if (leadData.selectedPlanType) {
            return leadData.selectedPlanType;
        }

        // Determine by travelers count
        const travelers = leadData.travelers ||
            leadData.service_specific?.guests ||
            leadData.serviceSpecific?.guests ||
            1;

        if (travelers === 1) return 'solo';
        if (travelers === 2) return 'couple';
        if (travelers >= 3 && travelers <= 6) return 'family';
        if (travelers > 6) return 'friends';

        // Check for corporate
        if (leadData.customer_category === 'corporate') return 'business';

        return 'family';
    }
}

export const travelPlanService = new TravelPlanService();