import { supabaseAdmin } from '../config';
import { Department, EnrichedAdmin, EnrichedTeam, EnrichedService } from '../interfaces/department.interface';

export const departmentRepository = {

    /**
     * Create a new department
     * @param name 
     * @param description 
     * @param admin_ids 
     * @param team_ids 
     * @param service_ids
     * @returns 
     */
    async createDepartment(
        name: string,
        description?: string,
        admin_ids: string[] = [],
        team_ids: string[] = [],
        service_ids: string[] = []
    ) {
        const { data, error } = await supabaseAdmin
            .from('departments')
            .insert({
                name,
                description,
                admin_ids,
                team_ids,
                service_ids,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        return data as Department;
    },

    /**
     * Get department by ID
     * @param id 
     * @returns 
     */
    async getById(id: string) {
        const { data, error } = await supabaseAdmin
            .from('departments')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as Department | null;
    },

    /**
     * List all departments
     * @returns 
     */
    async listDepartments() {
        const { data, error } = await supabaseAdmin
            .from('departments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Department[];
    },

    /**
     * Get enriched admins by list of user IDs
     * @param adminIds 
     * @returns 
     */
    async getAdminsByIds(adminIds: string[]): Promise<EnrichedAdmin[]> {
        if (!adminIds || adminIds.length === 0) return [];

        try {
            const { data: usersList, error } = await supabaseAdmin.auth.admin.listUsers();
            if (error) {
                console.error("Error fetching users from Supabase Auth:", error);
                return [];
            }

            const adminMap = new Map<string, EnrichedAdmin>();
            (usersList.users || []).forEach(u => {
                adminMap.set(u.id, {
                    id: u.id,
                    email: u.email || undefined,
                    full_name: u.user_metadata?.full_name || u.user_metadata?.name || undefined,
                    role_name: u.user_metadata?.role_name || u.user_metadata?.role || undefined,
                });
            });

            return adminIds.map(id => adminMap.get(id)).filter((a): a is EnrichedAdmin => a !== undefined);
        } catch (err) {
            console.error("Failed to resolve admins by IDs:", err);
            return [];
        }
    },

    /**
     * Get enriched teams by list of team IDs
     * @param teamIds 
     * @returns 
     */
    async getTeamsByIds(teamIds: string[]): Promise<EnrichedTeam[]> {
        if (!teamIds || teamIds.length === 0) return [];

        const { data, error } = await supabaseAdmin
            .from('teams')
            .select('id, name, description, members_count')
            .in('id', teamIds);

        if (error) {
            console.error("Failed to fetch teams by IDs:", error.message);
            return [];
        }

        return (data || []).map(t => ({
            id: t.id,
            name: t.name,
            description: t.description || undefined,
            members_count: t.members_count ?? 0,
        }));
    },

    /**
     * Get enriched services by list of service IDs
     * @param serviceIds 
     * @returns 
     */
    async getServicesByIds(serviceIds: string[]): Promise<EnrichedService[]> {
        if (!serviceIds || serviceIds.length === 0) return [];

        const { data, error } = await supabaseAdmin
            .from('services')
            .select('id, name')
            .in('id', serviceIds);

        if (error) {
            console.error("Failed to fetch services by IDs:", error.message);
            return [];
        }

        return (data || []).map(s => ({
            id: s.id,
            name: s.name
        }));
    },

    /**
     * Update department details
     * @param id 
     * @param updates 
     * @returns 
     */
    async updateDepartment(
        id: string,
        updates: {
            name?: string;
            description?: string;
            admin_ids?: string[];
            team_ids?: string[];
            service_ids?: string[];
            is_active?: boolean;
            updated_at?: Date;
        }
    ) {
        const payload = {
            ...updates,
            updated_at: new Date()
        };

        const { data, error } = await supabaseAdmin
            .from('departments')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Department;
    },

    /**
     * Delete department by ID
     * @param id 
     * @returns 
     */
    async deleteDepartment(id: string) {
        const { error } = await supabaseAdmin
            .from('departments')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
