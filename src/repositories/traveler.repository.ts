import { supabaseAdmin } from '../config';
import {
    ITraveler, CreateTravelerPayload,
    UpdateTravelerPayload,
    TravelerFilter
} from '../models/traveler.model';

export const travelerRepository = {

    /**
     * Check if traveler exists by email
     */
    async isTravelerExists(email: string): Promise<boolean> {
        const { data, error } = await supabaseAdmin
            .from('travelers')
            .select('id')
            .eq('traveler_email', email)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to check traveler: ${error.message}`);
        }

        return !!data;
    },

    /**
     * Get traveler by email
     */
    async getTravelerByEmail(email: string): Promise<ITraveler | null> {
        const { data, error } = await supabaseAdmin
            .from('travelers')
            .select('*')
            .eq('traveler_email', email)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to fetch traveler: ${error.message}`);
        }

        return data as ITraveler || null;
    },

    /**
     * Create a new traveler
     */
    async createTraveler(payload: CreateTravelerPayload): Promise<ITraveler> {
        const { data, error } = await supabaseAdmin
            .from('travelers')
            .insert({
                title: payload.title,
                traveler_name: payload.travelerName,
                traveler_phone: payload.travelerPhone,
                traveler_email: payload.travelerEmail,
                date_of_birth: payload.dateOfBirth,
                passport: payload.passport || null,
                gst: payload.gst || null,
                emergency_contact: payload.emergencyContact
            })
            .select()
            .single();

        if (error) {
            console.error("❌ Traveler creation error:", error);
            throw new Error(`Failed to create traveler: ${error.message}`);
        }

        return this.mapDatabaseToInterface(data);
    },

    /**
     * Get traveler by ID
     */
    async getTravelerById(id: string): Promise<ITraveler | null> {
        const { data, error } = await supabaseAdmin
            .from('travelers')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to fetch traveler: ${error.message}`);
        }

        return data ? this.mapDatabaseToInterface(data) : null;
    },

    /**
     * Get all travelers with filtering
     */
    async getAllTravelers(filter: TravelerFilter = {}): Promise<ITraveler[]> {
        let query = supabaseAdmin
            .from('travelers')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter.search) {
            query = query.or(
                `traveler_name.ilike.%${filter.search}%,traveler_email.ilike.%${filter.search}%,traveler_phone.ilike.%${filter.search}%`
            );
        }

        if (filter.title) {
            query = query.eq('title', filter.title);
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
            throw new Error(`Failed to fetch travelers: ${error.message}`);
        }

        return data.map((row: any) => this.mapDatabaseToInterface(row));
    },

    /**
     * Update traveler
     */
    async updateTraveler(id: string, payload: UpdateTravelerPayload): Promise<boolean> {
        const updateData: any = {};

        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.travelerName !== undefined) updateData.traveler_name = payload.travelerName;
        if (payload.travelerPhone !== undefined) updateData.traveler_phone = payload.travelerPhone;
        if (payload.travelerEmail !== undefined) updateData.traveler_email = payload.travelerEmail;
        if (payload.dateOfBirth !== undefined) updateData.date_of_birth = payload.dateOfBirth;
        if (payload.passport !== undefined) updateData.passport = payload.passport;
        if (payload.gst !== undefined) updateData.gst = payload.gst;
        if (payload.emergencyContact !== undefined) updateData.emergency_contact = payload.emergencyContact;

        updateData.updated_at = new Date().toISOString();

        const { error } = await supabaseAdmin
            .from('travelers')
            .update(updateData)
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to update traveler: ${error.message}`);
        }

        return true;
    },

    /**
     * Delete traveler
     */
    async deleteTraveler(id: string): Promise<boolean> {
        const { error } = await supabaseAdmin
            .from('travelers')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete traveler: ${error.message}`);
        }

        return true;
    },

    /**
     * Search travelers
     */
    async searchTravelers(query: string): Promise<ITraveler[]> {
        const { data, error } = await supabaseAdmin
            .from('travelers')
            .select('*')
            .or(`traveler_name.ilike.%${query}%,traveler_email.ilike.%${query}%,traveler_phone.ilike.%${query}%`)
            .limit(20)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to search travelers: ${error.message}`);
        }

        return data.map((row: any) => this.mapDatabaseToInterface(row));
    },

    /**
 * Advanced filter and sort travelers
 */
    async filterAndSortTravelers(filters: any, sort: any, pagination: any): Promise<{ travelers: ITraveler[]; total: number; page: number; totalPages: number }> {
        let query = supabaseAdmin
            .from('travelers')
            .select('*', { count: 'exact' });

        // Apply filters
        if (filters) {
            // Title filter (single or multiple)
            if (filters.title) {
                if (Array.isArray(filters.title)) {
                    query = query.in('title', filters.title);
                } else {
                    query = query.eq('title', filters.title);
                }
            }

            // Traveler name (partial match)
            if (filters.travelerName) {
                query = query.ilike('traveler_name', `%${filters.travelerName}%`);
            }

            // Traveler email (partial match)
            if (filters.travelerEmail) {
                query = query.ilike('traveler_email', `%${filters.travelerEmail}%`);
            }

            // Traveler phone (partial match)
            if (filters.travelerPhone) {
                query = query.ilike('traveler_phone', `%${filters.travelerPhone}%`);
            }

            // Date of birth range
            if (filters.dateOfBirthFrom) {
                query = query.gte('date_of_birth', filters.dateOfBirthFrom);
            }
            if (filters.dateOfBirthTo) {
                query = query.lte('date_of_birth', filters.dateOfBirthTo);
            }

            // Created date range
            if (filters.createdFrom) {
                query = query.gte('created_at', filters.createdFrom);
            }
            if (filters.createdTo) {
                query = query.lte('created_at', filters.createdTo);
            }

            // Has passport filter
            if (filters.hasPassport === true) {
                query = query.not('passport', 'is', null);
            } else if (filters.hasPassport === false) {
                query = query.is('passport', null);
            }

            // Has GST filter
            if (filters.hasGST === true) {
                query = query.not('gst', 'is', null);
            } else if (filters.hasGST === false) {
                query = query.is('gst', null);
            }

            // Nationality filter (JSON field)
            if (filters.nationality) {
                query = query.eq('passport->>nationality', filters.nationality);
            }
        }

        // Apply sorting
        if (sort && sort.field) {
            let sortField = sort.field;

            // Map interface field to database column
            switch (sortField) {
                case 'travelerName':
                    sortField = 'traveler_name';
                    break;
                case 'travelerEmail':
                    sortField = 'traveler_email';
                    break;
                case 'travelerPhone':
                    sortField = 'traveler_phone';
                    break;
                case 'dateOfBirth':
                    sortField = 'date_of_birth';
                    break;
                case 'created_at':
                    sortField = 'created_at';
                    break;
                case 'updated_at':
                    sortField = 'updated_at';
                    break;
                default:
                    sortField = sort.field;
            }

            query = query.order(sortField, { ascending: sort.order === 'asc' });
        } else {
            // Default sort by created_at desc
            query = query.order('created_at', { ascending: false });
        }

        // Apply pagination
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        query = query.range(start, end);

        // Execute query
        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Failed to filter and sort travelers: ${error.message}`);
        }

        const travelers = data.map((row: any) => this.mapDatabaseToInterface(row));
        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        return {
            travelers,
            total,
            page,
            totalPages
        };
    },

    /**
     * Map database row to interface
     */
    mapDatabaseToInterface(data: any): ITraveler {
        return {
            id: data.id,
            title: data.title,
            travelerName: data.traveler_name,
            travelerPhone: data.traveler_phone,
            travelerEmail: data.traveler_email,
            dateOfBirth: data.date_of_birth,
            passport: data.passport,
            gst: data.gst,
            emergencyContact: data.emergency_contact,
            created_at: data.created_at,
            updated_at: data.updated_at
        };
    }
};