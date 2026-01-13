import { supabaseAdmin } from '../config';
import {
    IItinerary,
    IItineraryService,
    IItineraryServiceOption,
    IItineraryWithRelations,
    ICreateItineraryDTO,
    IUpdateItineraryDTO,
    IItineraryFilter,
    IAddServiceToItineraryDTO,
    IUpdateItineraryServiceDTO,
    IUpdateItineraryOptionDTO
} from '../interfaces/itinerary.interface';
import { IService, ISubService } from '../interfaces/service.interface';

export const itineraryRepository = {
    
    // ============ CRUD Operations ============

    /**
     * Generate unique itinerary number
     */
    async generateItineraryNumber(): Promise<string> {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');


        const { count, error } = await supabaseAdmin
            .from('itineraries')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${year}-${month}-${day}T00:00:00Z`)
            .lt('created_at', `${year}-${month}-${day}T23:59:59Z`);

        if (error) {
            throw new Error(`Failed to generate itinerary number: ${error.message}`);
        }

        const sequence = String((count || 0) + 1).padStart(4, '0');
        return `ITIN-${year}${month}${day}-${sequence}`;
    },

    /**
     * Create a new itinerary
     */
    async createItinerary(payload: ICreateItineraryDTO): Promise<IItineraryWithRelations> {
        const itineraryNumber = await this.generateItineraryNumber();

        const { data: itineraryData, error: itineraryError } = await supabaseAdmin
            .from('itineraries')
            .insert({
                client_name: payload.client_name,
                client_email: payload.client_email,
                client_phone: payload.client_phone,
                number_of_travelers: payload.number_of_travelers || 1,
                from_location: payload.from_location,
                to_location: payload.to_location,
                travel_date: payload.travel_date,
                return_date: payload.return_date,
                budget_range: payload.budget_range,
                additional_notes: payload.additional_notes,
                itinerary_number: itineraryNumber,
                status: 'draft',
                currency: 'INR',
                is_active: true,
                metadata: payload.metadata || {}
            })
            .select()
            .single();

        if (itineraryError || !itineraryData) {
            throw new Error(`Failed to create itinerary: ${itineraryError?.message}`);
        }

        for (const [index, serviceItem] of payload.selected_services.entries()) {
            const { data: serviceData, error: serviceError } = await supabaseAdmin
                .from('services')
                .select('*')
                .eq('id', serviceItem.service_id)
                .single();

            if (serviceError || !serviceData) {
                throw new Error(`Failed to fetch service: ${serviceError?.message}`);
            }

            const { data: itineraryServiceData, error: serviceInsertError } = await supabaseAdmin
                .from('itinerary_services')
                .insert({
                    itinerary_id: itineraryData.id,
                    service_id: serviceItem.service_id,
                    service_name: serviceData.name,
                    service_code: serviceData.code,
                    service_icon: serviceData.icon,
                    is_primary: index === 0,
                    sort_order: index + 1
                })
                .select()
                .single();

            if (serviceInsertError || !itineraryServiceData) {
                throw new Error(`Failed to add service to itinerary: ${serviceInsertError?.message}`);
            }

            for (const option of serviceItem.selected_options) {
                const { data: subServiceData, error: subServiceError } = await supabaseAdmin
                    .from('sub_services')
                    .select(`
                    *,
                    sub_service_category:sub_service_categories (
                        id,
                        name
                    )
                `)
                    .eq('id', option.sub_service_id)
                    .single();

                if (subServiceError || !subServiceData) {
                    throw new Error(`Failed to fetch sub-service: ${subServiceError?.message}`);
                }

                await supabaseAdmin
                    .from('itinerary_service_options')
                    .insert({
                        itinerary_service_id: itineraryServiceData.id,
                        sub_service_id: option.sub_service_id,
                        sub_service_name: subServiceData.name,
                        sub_service_code: subServiceData.code,
                        category_id: subServiceData.sub_service_category.id,
                        category_name: subServiceData.sub_service_category.name,
                        quantity: option.quantity || 1,
                        notes: option.notes
                    });
            }
        }

        const itinerary = await this.getItineraryByIdWithRelations(itineraryData.id);

        if (!itinerary) {
            throw new Error('Failed to fetch created itinerary');
        }

        return itinerary;
    },


    /**
     * Get itinerary by ID
     */
    async getItineraryById(id: string): Promise<IItinerary | null> {
        const { data, error } = await supabaseAdmin
            .from('itineraries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch itinerary: ${error.message}`);
        }

        return data as IItinerary;
    },

    /**
     * Get itinerary by ID with relations
     */
    async getItineraryByIdWithRelations(id: string): Promise<IItineraryWithRelations | null> {

        const itinerary = await this.getItineraryById(id);
        if (!itinerary) {
            return null;
        }


        const { data: servicesData, error: servicesError } = await supabaseAdmin
            .from('itinerary_services')
            .select(`
                *,
                service:services (*),
                options:itinerary_service_options (
                    *,
                    sub_service:sub_services (*)
                )
            `)
            .eq('itinerary_id', id)
            .order('sort_order', { ascending: true });

        if (servicesError) {
            throw new Error(`Failed to fetch itinerary services: ${servicesError.message}`);
        }

        return {
            ...itinerary,
            services: servicesData.map(service => ({
                ...service,
                service: service.service,
                options: (service.options as IItineraryServiceOption[]).map(
                    (option: IItineraryServiceOption & { sub_service?: ISubService }) => ({
                        ...option,
                        sub_service: option.sub_service
                    })
                )

            }))
        } as IItineraryWithRelations;
    },

    /**
     * Get itinerary by itinerary number
     */
    async getItineraryByNumber(itineraryNumber: string): Promise<IItineraryWithRelations | null> {
        const { data, error } = await supabaseAdmin
            .from('itineraries')
            .select('*')
            .eq('itinerary_number', itineraryNumber)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch itinerary: ${error.message}`);
        }

        return await this.getItineraryByIdWithRelations(data.id);
    },

    /**
     * Get all itineraries with filtering
     */
    async getAllItineraries(filter: IItineraryFilter = {}): Promise<IItinerary[]> {
        let query = supabaseAdmin
            .from('itineraries')
            .select('*')
            .order(filter.sort_by || 'created_at', { ascending: filter.sort_order === 'asc' });


        if (filter.search) {
            query = query.or(`
                client_name.ilike.%${filter.search}%,
                client_email.ilike.%${filter.search}%,
                itinerary_number.ilike.%${filter.search}%,
                from_location.ilike.%${filter.search}%,
                to_location.ilike.%${filter.search}%
            `);
        }

        if (filter.status) {
            query = query.eq('status', filter.status);
        }

        if (filter.client_email) {
            query = query.eq('client_email', filter.client_email);
        }

        if (filter.from_date) {
            query = query.gte('travel_date', filter.from_date);
        }

        if (filter.to_date) {
            query = query.lte('travel_date', filter.to_date);
        }

        if (filter.is_active !== undefined) {
            query = query.eq('is_active', filter.is_active);
        }

        if (filter.limit) {
            query = query.limit(filter.limit);
        }

        if (filter.offset) {
            query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch itineraries: ${error.message}`);
        }

        return data as IItinerary[];
    },

    /**
     * Update itinerary
     */
    async updateItinerary(id: string, payload: IUpdateItineraryDTO): Promise<IItinerary> {
        const { data, error } = await supabaseAdmin
            .from('itineraries')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update itinerary: ${error.message}`);
        }

        return data as IItinerary;
    },

    /**
     * Delete itinerary (soft delete - set is_active to false)
     */
    async deleteItinerary(id: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('itineraries')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete itinerary: ${error.message}`);
        }

        return true;
    },

    /**
     * Add service to itinerary
     */
    async addServiceToItinerary(
        itineraryId: string,
        payload: IAddServiceToItineraryDTO
    ): Promise<IItineraryWithRelations> {

        const itinerary = await this.getItineraryById(itineraryId);
        if (!itinerary) {
            throw new Error('Itinerary not found');
        }


        const { data: serviceData, error: serviceError } = await supabaseAdmin
            .from('services')
            .select('*')
            .eq('id', payload.service_id)
            .single();

        if (serviceError) {
            throw new Error(`Failed to fetch service: ${serviceError.message}`);
        }


        const { data: existingService } = await supabaseAdmin
            .from('itinerary_services')
            .select('id')
            .eq('itinerary_id', itineraryId)
            .eq('service_id', payload.service_id)
            .single();

        if (existingService) {
            throw new Error('Service already exists in itinerary');
        }


        const { data: services, error: sortError } = await supabaseAdmin
            .from('itinerary_services')
            .select('sort_order')
            .eq('itinerary_id', itineraryId)
            .order('sort_order', { ascending: false })
            .limit(1);

        if (sortError) {
            throw new Error(`Failed to fetch services: ${sortError.message}`);
        }

        const sortOrder = services && services.length > 0 ? services[0].sort_order + 1 : 1;


        const { data: itineraryServiceData, error: serviceInsertError } = await supabaseAdmin
            .from('itinerary_services')
            .insert({
                itinerary_id: itineraryId,
                service_id: payload.service_id,
                service_name: serviceData.name,
                service_code: serviceData.code,
                service_icon: serviceData.icon,
                is_primary: false,
                sort_order: sortOrder
            })
            .select()
            .single();

        if (serviceInsertError) {
            throw new Error(`Failed to add service to itinerary: ${serviceInsertError.message}`);
        }


        for (const option of payload.selected_options) {

            const { data: subServiceData, error: subServiceError } = await supabaseAdmin
                .from('sub_services')
                .select(`
                    *,
                    sub_service_category:sub_service_categories (
                        id,
                        name
                    )
                `)
                .eq('id', option.sub_service_id)
                .single();

            if (subServiceError) {
                throw new Error(`Failed to fetch sub-service: ${subServiceError.message}`);
            }


            await supabaseAdmin
                .from('itinerary_service_options')
                .insert({
                    itinerary_service_id: itineraryServiceData.id,
                    sub_service_id: option.sub_service_id,
                    sub_service_name: subServiceData.name,
                    sub_service_code: subServiceData.code,
                    category_id: subServiceData.sub_service_category.id,
                    category_name: subServiceData.sub_service_category.name,
                    quantity: option.quantity || 1,
                    notes: option.notes
                });
        }

        const updatedItinerary = await this.getItineraryByIdWithRelations(itineraryId);

        if (!updatedItinerary) {
            throw new Error('Itinerary not found after update');
        }

        return updatedItinerary;
    },

    /**
     * Remove service from itinerary
     */
    async removeServiceFromItinerary(
        itineraryId: string,
        itineraryServiceId: string
    ): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('itinerary_services')
            .delete()
            .eq('id', itineraryServiceId)
            .eq('itinerary_id', itineraryId);

        if (error) {
            throw new Error(`Failed to remove service from itinerary: ${error.message}`);
        }

        return true;
    },

    /**
     * Update itinerary service
     */
    async updateItineraryService(
        itineraryServiceId: string,
        payload: IUpdateItineraryServiceDTO
    ): Promise<IItineraryService> {
        const { data, error } = await supabaseAdmin
            .from('itinerary_services')
            .update(payload)
            .eq('id', itineraryServiceId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update itinerary service: ${error.message}`);
        }

        return data as IItineraryService;
    },

    /**
     * Update itinerary option
     */
    async updateItineraryOption(
        optionId: string,
        payload: IUpdateItineraryOptionDTO
    ): Promise<IItineraryServiceOption> {

        const updateData: any = { ...payload };
        if (payload.price_per_unit !== undefined) {
            const { data: existingOption } = await supabaseAdmin
                .from('itinerary_service_options')
                .select('quantity')
                .eq('id', optionId)
                .single();

            if (existingOption) {
                updateData.total_price = payload.price_per_unit * (existingOption.quantity || 1);
            }
        }

        const { data, error } = await supabaseAdmin
            .from('itinerary_service_options')
            .update(updateData)
            .eq('id', optionId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update itinerary option: ${error.message}`);
        }

        return data as IItineraryServiceOption;
    },

    /**
     * Remove option from itinerary service
     */
    async removeOptionFromItinerary(optionId: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('itinerary_service_options')
            .delete()
            .eq('id', optionId);

        if (error) {
            throw new Error(`Failed to remove option: ${error.message}`);
        }

        return true;
    },

    /**
     * Update itinerary total price based on options
     */
    async updateItineraryTotalPrice(itineraryId: string): Promise<number> {

        const { data, error } = await supabaseAdmin
            .from('itinerary_service_options')
            .select(`
                total_price,
                itinerary_service:itinerary_services (
                    itinerary_id
                )
            `)
            .eq('itinerary_services.itinerary_id', itineraryId)
            .not('total_price', 'is', null);

        if (error) {
            throw new Error(`Failed to fetch itinerary options: ${error.message}`);
        }

        const totalPrice = data.reduce((sum, option) => sum + (option.total_price || 0), 0);


        await supabaseAdmin
            .from('itineraries')
            .update({ total_price: totalPrice })
            .eq('id', itineraryId);

        return totalPrice;
    },

    // ============ Statistics ============

    /**
     * Get itinerary statistics
     */
    async getItineraryStatistics(): Promise<{
        total: number;
        draft: number;
        confirmed: number;
        booked: number;
        cancelled: number;
        completed: number;
    }> {
        const { data, error } = await supabaseAdmin
            .from('itineraries')
            .select('status')
            .eq('is_active', true);

        if (error) {
            throw new Error(`Failed to fetch itinerary statistics: ${error.message}`);
        }

        const stats = {
            total: data.length,
            draft: 0,
            confirmed: 0,
            booked: 0,
            cancelled: 0,
            completed: 0
        };

        data.forEach(item => {
            if (stats[item.status as keyof typeof stats] !== undefined) {
                stats[item.status as keyof typeof stats] += 1;
            }
        });

        return stats;
    },

    /**
     * Search itineraries by client or itinerary number
     */
    async searchItineraries(searchTerm: string, limit: number = 20): Promise<IItinerary[]> {
        const { data, error } = await supabaseAdmin
            .from('itineraries')
            .select('*')
            .or(`
                client_name.ilike.%${searchTerm}%,
                client_email.ilike.%${searchTerm}%,
                itinerary_number.ilike.%${searchTerm}%
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to search itineraries: ${error.message}`);
        }

        return data as IItinerary[];
    }
};