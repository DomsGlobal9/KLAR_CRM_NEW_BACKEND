import { itineraryRepository } from '../repositories/itinerary.repository';
import {
    IItinerary,
    IItineraryWithRelations,
    ICreateItineraryDTO,
    IUpdateItineraryDTO,
    IItineraryFilter,
    IAddServiceToItineraryDTO,
    IUpdateItineraryServiceDTO,
    IUpdateItineraryOptionDTO
} from '../interfaces/itinerary.interface';
import { serviceRepository } from '../repositories';

export const itineraryService = {
    // ============ CRUD Operations ============

    /**
     * Create a new itinerary with validation
     */
    async createItinerary(payload: ICreateItineraryDTO): Promise<IItineraryWithRelations> {

        if (!payload.client_name || !payload.client_email || !payload.from_location || !payload.to_location || !payload.travel_date) {
            throw new Error('Client name, email, from location, to location, and travel date are required');
        }


        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(payload.client_email)) {
            throw new Error('Invalid email format');
        }


        const travelDate = new Date(payload.travel_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (travelDate < today) {
            throw new Error('Travel date must be in the future');
        }


        if (payload.return_date) {
            const returnDate = new Date(payload.return_date);
            if (returnDate <= travelDate) {
                throw new Error('Return date must be after travel date');
            }
        }


        if (payload.number_of_travelers !== undefined && payload.number_of_travelers < 1) {
            throw new Error('Number of travelers must be at least 1');
        }


        if (!payload.selected_services || payload.selected_services.length === 0) {
            throw new Error('At least one service must be selected');
        }


        for (const serviceItem of payload.selected_services) {
            const serviceExists = await serviceRepository.getServiceById(serviceItem.service_id);
            if (!serviceExists) {
                throw new Error(`Service with ID ${serviceItem.service_id} not found`);
            }


            for (const option of serviceItem.selected_options) {
                const subServiceExists = await serviceRepository.getSubServiceById(option.sub_service_id);
                if (!subServiceExists) {
                    throw new Error(`Sub-service with ID ${option.sub_service_id} not found`);
                }
            }
        }

        return await itineraryRepository.createItinerary(payload);
    },

    /**
     * Get itinerary by ID
     */
    async getItineraryById(id: string): Promise<IItineraryWithRelations | null> {
        return await itineraryRepository.getItineraryByIdWithRelations(id);
    },

    /**
     * Get itinerary by itinerary number
     */
    async getItineraryByNumber(itineraryNumber: string): Promise<IItineraryWithRelations | null> {
        return await itineraryRepository.getItineraryByNumber(itineraryNumber);
    },

    /**
     * Get all itineraries
     */
    async getAllItineraries(filter: IItineraryFilter = {}): Promise<IItinerary[]> {
        return await itineraryRepository.getAllItineraries(filter);
    },

    /**
     * Update itinerary
     */
    async updateItinerary(id: string, payload: IUpdateItineraryDTO): Promise<IItinerary> {

        const existingItinerary = await itineraryRepository.getItineraryById(id);
        if (!existingItinerary) {
            throw new Error('Itinerary not found');
        }


        if (payload.client_email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(payload.client_email)) {
                throw new Error('Invalid email format');
            }
        }


        if (payload.travel_date) {
            const travelDate = new Date(payload.travel_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (travelDate < today) {
                throw new Error('Travel date must be in the future');
            }
        }


        if (payload.return_date) {
            const travelDate = new Date(payload.travel_date || existingItinerary.travel_date);
            const returnDate = new Date(payload.return_date);

            if (returnDate <= travelDate) {
                throw new Error('Return date must be after travel date');
            }
        }


        if (payload.number_of_travelers !== undefined && payload.number_of_travelers < 1) {
            throw new Error('Number of travelers must be at least 1');
        }

        return await itineraryRepository.updateItinerary(id, payload);
    },

    /**
     * Delete itinerary (soft delete)
     */
    async deleteItinerary(id: string): Promise<boolean> {
        const existingItinerary = await itineraryRepository.getItineraryById(id);
        if (!existingItinerary) {
            throw new Error('Itinerary not found');
        }

        return await itineraryRepository.deleteItinerary(id);
    },

    /**
     * Add service to itinerary
     */
    async addServiceToItinerary(
        itineraryId: string,
        payload: IAddServiceToItineraryDTO
    ): Promise<IItineraryWithRelations> {

        const serviceExists = await serviceRepository.getServiceById(payload.service_id);
        if (!serviceExists) {
            throw new Error('Service not found');
        }


        for (const option of payload.selected_options) {
            const subServiceExists = await serviceRepository.getSubServiceById(option.sub_service_id);
            if (!subServiceExists) {
                throw new Error(`Sub-service with ID ${option.sub_service_id} not found`);
            }
        }

        return await itineraryRepository.addServiceToItinerary(itineraryId, payload);
    },

    /**
     * Remove service from itinerary
     */
    async removeServiceFromItinerary(
        itineraryId: string,
        itineraryServiceId: string
    ): Promise<boolean> {
        return await itineraryRepository.removeServiceFromItinerary(itineraryId, itineraryServiceId);
    },

    /**
     * Update itinerary service
     */
    async updateItineraryService(
        itineraryServiceId: string,
        payload: IUpdateItineraryServiceDTO
    ): Promise<any> {
        return await itineraryRepository.updateItineraryService(itineraryServiceId, payload);
    },

    /**
     * Update itinerary option
     */
    async updateItineraryOption(
        optionId: string,
        payload: IUpdateItineraryOptionDTO
    ): Promise<any> {

        if (payload.price_per_unit !== undefined && payload.price_per_unit < 0) {
            throw new Error('Price must be non-negative');
        }


        if (payload.quantity !== undefined && payload.quantity < 1) {
            throw new Error('Quantity must be at least 1');
        }

        return await itineraryRepository.updateItineraryOption(optionId, payload);
    },

    /**
     * Remove option from itinerary service
     */
    async removeOptionFromItinerary(optionId: string): Promise<boolean> {
        return await itineraryRepository.removeOptionFromItinerary(optionId);
    },

    /**
     * Update itinerary total price
     */
    async updateItineraryTotalPrice(itineraryId: string): Promise<number> {
        return await itineraryRepository.updateItineraryTotalPrice(itineraryId);
    },

    // ============ Helper Methods ============

    /**
     * Change itinerary status
     */
    async changeItineraryStatus(id: string, status: 'draft' | 'confirmed' | 'booked' | 'cancelled' | 'completed'): Promise<IItinerary> {
        const validStatuses = ['draft', 'confirmed', 'booked', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        return await itineraryRepository.updateItinerary(id, { status });
    },

    /**
     * Get itinerary statistics
     */
    async getItineraryStatistics() {
        return await itineraryRepository.getItineraryStatistics();
    },

    /**
     * Search itineraries
     */
    async searchItineraries(searchTerm: string, limit: number = 20) {
        if (!searchTerm || searchTerm.trim().length < 2) {
            throw new Error('Search term must be at least 2 characters long');
        }

        return await itineraryRepository.searchItineraries(searchTerm, limit);
    },

    /**
     * Convert frontend itinerary data to DTO
     */
    convertFrontendItineraryToDTO(frontendData: any): ICreateItineraryDTO {
        return {
            client_name: frontendData.client?.name || '',
            client_email: frontendData.client?.email || '',
            client_phone: frontendData.client?.phone || '',
            number_of_travelers: frontendData.client?.numberOfTravelers || 1,

            from_location: frontendData.travelDetails?.fromLocation || '',
            to_location: frontendData.travelDetails?.toLocation || '',
            travel_date: frontendData.travelDetails?.travelDate || '',
            return_date: frontendData.travelDetails?.returnDate || '',
            budget_range: frontendData.travelDetails?.budgetRange || '',
            additional_notes: frontendData.travelDetails?.additionalNotes || '',

            selected_services: (frontendData.selectedServices || []).map((service: any) => ({
                service_id: service.serviceId,
                selected_options: (service.selectedOptions || []).map((option: any) => ({
                    sub_service_id: option.subServiceId,
                    quantity: 1,
                    notes: `Selected option: ${option.subServiceName}`
                }))
            })),

            metadata: {
                frontend_metadata: frontendData.metadata,
                created_from_frontend: true,
                total_services_selected: frontendData.metadata?.totalServicesSelected || 0,
                total_options_selected: frontendData.metadata?.totalOptionsSelected || 0
            }
        };
    }
};