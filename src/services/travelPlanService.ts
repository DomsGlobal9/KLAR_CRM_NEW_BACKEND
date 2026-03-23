import axios from 'axios';
import { envConfig } from '../config';

class TravelPlanService {
    private readonly PLAN_API_URL = `${envConfig.S3_SERVER_URL}/plan`;
    
    async generateTravelPlan(leadData: any): Promise<any> {
        try {
            const travelRequest = this.prepareTravelRequest(leadData);
            
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
        
        const request: any = {
            from: this.extractFromLocation(leadData),
            to: this.extractDestination(leadData),
            days: this.extractDuration(leadData),
            budget: this.extractBudget(leadData),
            travel_type: this.extractTravelType(leadData),
        };
        
        request.lead_data = {
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            travelers: leadData.travelers || leadData.service_specific?.guests,
            preferred_contact: leadData.preferred_contact_method,
            inquiry_source: leadData.inquiry_source,
            country_city: leadData.country_city,
        };
        
        if (leadData.service_selections && leadData.service_selections.length > 0) {
            request.services = leadData.service_selections.map((service: any) => ({
                name: service.service_name,
                type: service.service_type,
                categories: service.categories,
                specific: service.service_specific,
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
               leadData.country_city?.split(',')[0] || 
               'Not specified';
    }
    
    private extractDestination(leadData: any): string {
        return leadData.destination || 
               leadData.country_city || 
               leadData.service_specific?.arrivalPort || 
               'Not specified';
    }
    
    private extractDuration(leadData: any): number {

        if (leadData.notes) {
            const durationMatch = leadData.notes.match(/Duration:\s*(\d+)\s*days?/i);
            if (durationMatch) return parseInt(durationMatch[1]);
        }
        
        
        if (leadData.service_specific?.duration) return leadData.service_specific.duration;
        
        
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
        
        if (leadData.budget_range) {
            const budget = leadData.budget_range.toLowerCase();
            if (budget.includes('low') || budget.includes('0-')) return 'low';
            if (budget.includes('mid')) return 'mid';
            if (budget.includes('high')) return 'high';
        }
        
        
        if (leadData.budget) {
            if (leadData.budget < 30000) return 'low';
            if (leadData.budget < 100000) return 'mid';
            return 'high';
        }
        
        
        if (leadData.notes) {
            if (leadData.notes.includes('₹45,000 - ₹75,000')) return 'mid';
            if (leadData.notes.includes('₹0 - ₹78000')) return 'low';
        }
        
        return 'mid';
    }
    
    private extractTravelType(leadData: any): string {
        
        const travelers = leadData.travelers || leadData.service_specific?.guests || 1;
        
        if (travelers === 1) return 'solo';
        if (travelers === 2) return 'couple';
        if (travelers >= 3 && travelers <= 6) return 'family';
        if (travelers > 6) return 'friends';
        
        
        if (leadData.customer_category === 'corporate') return 'business';
        
        
        if (leadData.travel_plan_type === 'adventure') return 'family';
        
        return 'family';
    }
}

export const travelPlanService = new TravelPlanService();