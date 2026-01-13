import { IService, ISubService } from './service.interface';

export interface IItinerary {
    id: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    number_of_travelers: number;

    from_location: string;
    to_location: string;
    travel_date: string;
    return_date?: string;
    budget_range?: string;
    additional_notes?: string;

    status: 'draft' | 'confirmed' | 'booked' | 'cancelled' | 'completed';
    itinerary_number: string;
    total_price?: number;
    currency: string;

    is_active: boolean;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface IItineraryService {
    id: string;
    itinerary_id: string;
    service_id: string;
    service_name: string;
    service_code: string;
    service_icon?: string;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface IItineraryServiceOption {
    id: string;
    itinerary_service_id: string;
    sub_service_id: string;
    sub_service_name: string;
    sub_service_code: string;
    category_id: string;
    category_name: string;

    quantity: number;
    price_per_unit?: number;
    total_price?: number;
    notes?: string;

    created_at: string;
    updated_at: string;
}

export interface IItineraryWithRelations extends IItinerary {
    services: Array<IItineraryService & {
        service?: IService;
        options: Array<IItineraryServiceOption & {
            sub_service?: ISubService;
        }>;
    }>;
}

// DTOs
export interface ICreateItineraryDTO {
    client_name: string;
    client_email: string;
    client_phone?: string;
    number_of_travelers?: number;

    from_location: string;
    to_location: string;
    travel_date: string;
    return_date?: string;
    budget_range?: string;
    additional_notes?: string;

    selected_services: Array<{
        service_id: string;
        selected_options: Array<{
            sub_service_id: string;
            quantity?: number;
            notes?: string;
        }>;
    }>;

    metadata?: Record<string, any>;
}

export interface IUpdateItineraryDTO {
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    number_of_travelers?: number;

    from_location?: string;
    to_location?: string;
    travel_date?: string;
    return_date?: string;
    budget_range?: string;
    additional_notes?: string;

    status?: 'draft' | 'confirmed' | 'booked' | 'cancelled' | 'completed';
    total_price?: number;
    currency?: string;

    is_active?: boolean;
    metadata?: Record<string, any>;
}

export interface IItineraryFilter {
    search?: string;
    status?: string;
    client_email?: string;
    from_date?: string;
    to_date?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
    sort_by?: 'created_at' | 'travel_date' | 'client_name';
    sort_order?: 'asc' | 'desc';
}

export interface IAddServiceToItineraryDTO {
    service_id: string;
    selected_options: Array<{
        sub_service_id: string;
        quantity?: number;
        notes?: string;
    }>;
}

export interface IUpdateItineraryServiceDTO {
    is_primary?: boolean;
    sort_order?: number;
}

export interface IUpdateItineraryOptionDTO {
    quantity?: number;
    price_per_unit?: number;
    notes?: string;
}