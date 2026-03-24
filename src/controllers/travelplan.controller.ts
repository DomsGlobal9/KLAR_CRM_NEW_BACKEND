import { Request, Response } from 'express';
import { travelPlanService } from '../services/travelPlanService';
import { AuthRequest } from '../middleware';

export const travelPlanController = {
    /**
     * Generate travel plan from lead data
     * POST /api/travel-plans/generate
     */
    async generateTravelPlan(req: AuthRequest, res: Response) {
        try {
            const leadData = req.body;

            const travelPlan = await travelPlanService.generateTravelPlan(leadData);

            res.status(200).json({
                success: true,
                message: 'Travel plan generated successfully',
                data: travelPlan
            });

        } catch (error: any) {
            console.error('❌ Travel plan generation controller error:', error);
            
            // Check if it's a validation error
            if (error.message.includes('required')) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            
            // Check if it's a service unavailable error
            if (error.message.includes('Failed to generate travel plan')) {
                return res.status(503).json({
                    success: false,
                    error: 'Travel plan service is currently unavailable. Please try again later.'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Failed to generate travel plan. Please try again.'
            });
        }
    },

    /**
     * Generate travel plan from lead ID
     * GET /api/travel-plans/generate/:leadId
     */
    async generateTravelPlanByLeadId(req: AuthRequest, res: Response) {
        try {
            const { leadId } = req.params;
            
            if (!leadId) {
                return res.status(400).json({
                    success: false,
                    error: 'Lead ID is required'
                });
            }

            // You might need to fetch lead data from your lead service here
            // For now, we'll assume the lead data is passed or fetched
            // This is a placeholder - you'll need to implement lead fetching
            const leadData = { id: leadId }; // Replace with actual lead fetch
            
            console.log('📝 Generating travel plan for lead ID:', leadId);
            
            const travelPlan = await travelPlanService.generateTravelPlan(leadData);
            
            res.status(200).json({
                success: true,
                message: 'Travel plan generated successfully',
                data: travelPlan
            });

        } catch (error: any) {
            console.error('❌ Travel plan generation by lead ID error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to generate travel plan'
            });
        }
    },

    /**
     * Test travel plan generation with sample data
     * POST /api/travel-plans/test
     */
    async testTravelPlanGeneration(req: Request, res: Response) {
        try {
            // Sample test data based on your payload console
            const testLeadData = {
                name: "Test User",
                email: "test@example.com",
                phone: "9876543210",
                inquiry_source: "test",
                source_medium: "test",
                budget_range: "₹0 - ₹50000",
                country_city: "Test City",
                travel_plan_type: "adventure",
                notes: "🎯 Test travel plan generation\n💰 Estimated Cost: ₹45,000 - ₹75,000\n📅 Duration: 7 days\n🏷️ Plan Type: adventure",
                travelers: 3,
                service_selections: [
                    {
                        service_name: "Flights",
                        service_type: "flight",
                        categories: [
                            {
                                category_name: "Trip Type",
                                sub_service_single: "5e071086-d252-4bd5-8ee2-adcd57793600"
                            },
                            {
                                category_name: "Travel Scope",
                                sub_service_single: "3beb5f35-7f6e-4301-b21e-58670a21cf2f"
                            }
                        ],
                        service_specific: {
                            travelers: 3,
                            travelDate: "2026-03-27",
                            returnDate: "2026-04-03",
                            departureCity: "Test Departure",
                            arrivalCity: "Test Arrival"
                        }
                    }
                ],
                metadata: {
                    has_travel_plan: true,
                    travel_plan_type: "adventure",
                    services_summary: [
                        {
                            service_type: "flight",
                            category: "Trip Type",
                            sub_services: ["One-Way"]
                        }
                    ]
                }
            };
            
            const travelPlan = await travelPlanService.generateTravelPlan(testLeadData);
            
            res.status(200).json({
                success: true,
                message: 'Test travel plan generated successfully',
                data: travelPlan
            });

        } catch (error: any) {
            console.error('❌ Test travel plan generation error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to generate test travel plan'
            });
        }
    },

    /**
     * Get travel plan by ID
     * GET /api/travel-plans/:planId
     */
    async getTravelPlanById(req: Request, res: Response) {
        try {
            const { planId } = req.params;
            
            if (!planId) {
                return res.status(400).json({
                    success: false,
                    error: 'Plan ID is required'
                });
            }
            
            // You'll need to implement a method to fetch travel plan by ID
            // This could be from your database or from the external API
            // For now, this is a placeholder
            
            res.status(200).json({
                success: true,
                message: 'Travel plan retrieved successfully',
                data: {
                    id: planId,
                    // Add your travel plan data here
                }
            });
            
        } catch (error: any) {
            console.error('❌ Get travel plan error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to retrieve travel plan'
            });
        }
    },

    /**
     * Save travel plan to lead
     * POST /api/travel-plans/save/:leadId
     */
    async saveTravelPlanToLead(req: AuthRequest, res: Response) {
        try {
            const { leadId } = req.params;
            const { travelPlan } = req.body;
            
            if (!leadId) {
                return res.status(400).json({
                    success: false,
                    error: 'Lead ID is required'
                });
            }
            
            if (!travelPlan) {
                return res.status(400).json({
                    success: false,
                    error: 'Travel plan data is required'
                });
            }
            
            // You'll need to implement saving travel plan to lead
            // This could be updating the lead's travel_plan field in your database
            console.log(`💾 Saving travel plan to lead ${leadId}`);
            
            res.status(200).json({
                success: true,
                message: 'Travel plan saved successfully',
                data: {
                    leadId,
                    travelPlanId: travelPlan.id || 'plan_123'
                }
            });
            
        } catch (error: any) {
            console.error('❌ Save travel plan error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to save travel plan'
            });
        }
    }
};