import { supabaseAdmin } from '../config';
import {
    ITraveler, CreateTravelerPayload,
    UpdateTravelerPayload,
    TravelerFilter
} from '../models/traveler.model';

export const travelerRepository = {

    async isTravelerExists(email: string): Promise<boolean> {
        if (!email) return false;
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

    async getTravelerByEmail(email: string): Promise<ITraveler | null> {
        if (!email) return null;
        const { data, error } = await supabaseAdmin
            .from('travelers')
            .select('*')
            .eq('traveler_email', email)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to fetch traveler: ${error.message}`);
        }

        return data ? this.mapDatabaseToInterface(data) : null;
    },

    async getTravelerByPhone(phone: string): Promise<ITraveler | null> {
        if (!phone) return null;
        const { data, error } = await supabaseAdmin
            .from('travelers')
            .select('*')
            .eq('traveler_phone', phone)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to fetch traveler by phone: ${error.message}`);
        }

        return data ? this.mapDatabaseToInterface(data) : null;
    },

    async createTraveler(payload: CreateTravelerPayload): Promise<ITraveler> {
        const insertData: any = {};

        if (payload.title) insertData.title = payload.title;
        if (payload.travelerName) insertData.traveler_name = payload.travelerName;
        if (payload.travelerPhone) insertData.traveler_phone = payload.travelerPhone;
        if (payload.travelerEmail) insertData.traveler_email = payload.travelerEmail;
        if (payload.dateOfBirth) insertData.date_of_birth = payload.dateOfBirth;
        if (payload.passport) insertData.passport = payload.passport;
        if (payload.gst) insertData.gst = payload.gst;
        if (payload.emergencyContact) insertData.emergency_contact = payload.emergencyContact;

        // Set group_id
        if (payload.group_id) {
            insertData.group_id = payload.group_id;
        } else {
            // This should be handled in service before calling repository
            throw new Error('group_id is required');
        }


        const { data, error } = await supabaseAdmin
            .from('travelers')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error("❌ Traveler creation error:", error);
            throw new Error(`Failed to create traveler: ${error.message}`);
        }

        return this.mapDatabaseToInterface(data);
    },

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

    async filterAndSortTravelers(filters: any, sort: any, pagination: any): Promise<{ travelers: ITraveler[]; total: number; page: number; totalPages: number }> {
        let query = supabaseAdmin
            .from('travelers')
            .select('*', { count: 'exact' });

        if (filters) {
            if (filters.title) {
                if (Array.isArray(filters.title)) {
                    query = query.in('title', filters.title);
                } else {
                    query = query.eq('title', filters.title);
                }
            }

            if (filters.travelerName) {
                query = query.ilike('traveler_name', `%${filters.travelerName}%`);
            }

            if (filters.travelerEmail) {
                query = query.ilike('traveler_email', `%${filters.travelerEmail}%`);
            }

            if (filters.travelerPhone) {
                query = query.ilike('traveler_phone', `%${filters.travelerPhone}%`);
            }

            if (filters.dateOfBirthFrom) {
                query = query.gte('date_of_birth', filters.dateOfBirthFrom);
            }
            if (filters.dateOfBirthTo) {
                query = query.lte('date_of_birth', filters.dateOfBirthTo);
            }

            if (filters.createdFrom) {
                query = query.gte('created_at', filters.createdFrom);
            }
            if (filters.createdTo) {
                query = query.lte('created_at', filters.createdTo);
            }

            if (filters.hasPassport === true) {
                query = query.not('passport', 'is', null);
            } else if (filters.hasPassport === false) {
                query = query.is('passport', null);
            }

            if (filters.hasGST === true) {
                query = query.not('gst', 'is', null);
            } else if (filters.hasGST === false) {
                query = query.is('gst', null);
            }

            if (filters.nationality) {
                query = query.eq('passport->>nationality', filters.nationality);
            }
        }

        if (sort && sort.field) {
            let sortField = sort.field;

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
            query = query.order('created_at', { ascending: false });
        }

        const page = pagination?.page || 1;
        const limit = pagination?.limit || 10;
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        query = query.range(start, end);

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

    async checkBulkExists(travelers: Array<{ email: string; phone: string }>): Promise<{
        emails: Set<string>;
        phones: Set<string>;
    }> {
        const emails = travelers.map(t => t.email).filter(Boolean);
        const phones = travelers.map(t => t.phone).filter(Boolean);

        if (emails.length === 0 && phones.length === 0) {
            return { emails: new Set<string>(), phones: new Set<string>() };
        }

        try {
            let query = supabaseAdmin
                .from('travelers')
                .select('traveler_email, traveler_phone');

            const conditions = [];
            if (emails.length > 0) {
                const emailList = emails.map(e => `'${e.replace(/'/g, "''")}'`).join(',');
                conditions.push(`traveler_email.in.(${emailList})`);
            }
            if (phones.length > 0) {
                const phoneList = phones.map(p => `'${p.replace(/'/g, "''")}'`).join(',');
                conditions.push(`traveler_phone.in.(${phoneList})`);
            }

            if (conditions.length > 0) {
                query = query.or(conditions.join(','));
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error in checkBulkExists:', error);
                return { emails: new Set<string>(), phones: new Set<string>() };
            }

            const emailSet = new Set<string>();
            const phoneSet = new Set<string>();

            data?.forEach(row => {
                if (row.traveler_email) emailSet.add(row.traveler_email);
                if (row.traveler_phone) phoneSet.add(row.traveler_phone);
            });

            return { emails: emailSet, phones: phoneSet };
        } catch (error) {
            console.error('Error in checkBulkExists:', error);
            return { emails: new Set<string>(), phones: new Set<string>() };
        }
    },

    async checkExistingTravelers(emails: string[], phones: string[]): Promise<{
        emails: Set<string>;
        phones: Set<string>;
        details: Array<{ email: string; phone: string; id: string }>;
    }> {
        const emailSet = new Set<string>();
        const phoneSet = new Set<string>();
        const details: Array<{ email: string; phone: string; id: string }> = [];

        if (emails.length === 0 && phones.length === 0) {
            return { emails: emailSet, phones: phoneSet, details: [] };
        }

        try {
            let query = supabaseAdmin
                .from('travelers')
                .select('id, traveler_email, traveler_phone');

            const conditions = [];
            if (emails.length > 0) {
                const emailList = emails.map(e => `'${e.replace(/'/g, "''")}'`).join(',');
                conditions.push(`traveler_email.in.(${emailList})`);
            }
            if (phones.length > 0) {
                const phoneList = phones.map(p => `'${p.replace(/'/g, "''")}'`).join(',');
                conditions.push(`traveler_phone.in.(${phoneList})`);
            }

            if (conditions.length > 0) {
                query = query.or(conditions.join(','));
            }

            const { data, error } = await query;

            if (error) {
                throw new Error(`Failed to check existing travelers: ${error.message}`);
            }

            data?.forEach(row => {
                if (row.traveler_email) {
                    emailSet.add(row.traveler_email);
                }
                if (row.traveler_phone) {
                    phoneSet.add(row.traveler_phone);
                }
                details.push({
                    email: row.traveler_email || '',
                    phone: row.traveler_phone || '',
                    id: row.id
                });
            });

            return { emails: emailSet, phones: phoneSet, details };
        } catch (error) {
            console.error('Error in checkExistingTravelers:', error);
            return { emails: emailSet, phones: phoneSet, details: [] };
        }
    },

    async bulkCreateTravelers(travelersData: any[]): Promise<any[]> {
        const results = [];

        const batchSize = 50;
        for (let i = 0; i < travelersData.length; i += batchSize) {
            const batch = travelersData.slice(i, i + batchSize);

            try {
                const { data, error } = await supabaseAdmin
                    .from('travelers')
                    .insert(batch)
                    .select();

                if (error) {
                    throw new Error(`Batch insert failed: ${error.message}`);
                }

                results.push(...data);
            } catch (error: any) {
                throw error;
            }
        }

        return results;
    },

    // NEW METHOD: Find group by email or phone
    async findGroupByEmailOrPhone(email?: string, phone?: string): Promise<string | null> {
        if (!email && !phone) return null;

        let query = supabaseAdmin
            .from('travelers')
            .select('group_id')
            .limit(1);

        if (email) {
            query = query.eq('traveler_email', email);
        } else if (phone) {
            query = query.eq('traveler_phone', phone);
        }

        const { data, error } = await query;

        if (error || !data || data.length === 0) {
            return null;
        }

        return data[0].group_id;
    },

    // NEW METHOD: Find or create group
    async findOrCreateGroup(email?: string, phone?: string): Promise<string> {
        // First, try to find existing group by email or phone
        if (email || phone) {
            let query = supabaseAdmin
                .from('travelers')
                .select('group_id')
                .limit(1);

            if (email) {
                query = query.eq('traveler_email', email);
            } else if (phone) {
                query = query.eq('traveler_phone', phone);
            }

            const { data, error } = await query;

            if (!error && data && data.length > 0) {
                return data[0].group_id;
            }
        }

        // If no existing group found, create a new group ID
        const groupId = `GRP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return groupId;
    },

    // NEW METHOD: Get travelers by group
    async getTravelersByGroup(groupId: string): Promise<ITraveler[]> {
        const { data, error } = await supabaseAdmin
            .from('travelers')
            .select('*')
            .eq('group_id', groupId)
            .order('is_primary', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch travelers by group: ${error.message}`);
        }

        return data.map((row: any) => this.mapDatabaseToInterface(row));
    },

    // UPDATED: mapDatabaseToInterface with group_id and is_primary
    mapDatabaseToInterface(data: any): ITraveler {
        return {
            id: data.id,
            group_id: data.group_id,
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