import { supabaseAdmin } from '../config';
import { ITraveler,CreateTravelerPayload,
    UpdateTravelerPayload,
    TravelerFilter } from '../models/traveler.model';

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