import { supabaseAdmin } from '../config';
import { AuthRepository } from './auth.repository';
import { Team } from '../interfaces/team.interface';

export const teamRepository = {

    /**
     * Create a new team
     * @param name 
     * @param description 
     * @returns   
     */
    async createTeam(name: string, description?: string) {
        const { data, error } = await supabaseAdmin
            .from('teams')
            .insert({
                name,
                description,
                members_count: 0
            })
            .select()
            .single();

        if (error) throw error;
        return data as Team;
    },

    /**
     * Get all teams
     * @returns 
     */
    async getAll() {
        const { data, error } = await supabaseAdmin
            .from('teams')
            .select('*')
            .order('name');
        if (error) throw error;
        return data ?? [];
    },

    /**
     * Get team by ID
     * @param id 
     * @returns 
     */
    async getById(id: string) {
        const { data, error } = await supabaseAdmin
            .from('teams')
            .select('*')
            .eq('id', id)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ?? null;
    },

    /**
     * Get team by ID
     * @param id 
     * @returns 
     */
    async getTeamById(id: string) {
        const { data, error } = await supabaseAdmin
            .from('teams')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Team;
    },

    /**
     * List all teams
     * @returns 
     */
    async listTeams() {
        const { data, error } = await supabaseAdmin
            .from('teams')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Team[];
    },

    /**
     * Update team details
     * @param id 
     * @param updates 
     * @returns 
     */
    async updateTeam(id: string, updates: { name?: string; description?: string; is_active?: boolean }) {
        const { data, error } = await supabaseAdmin
            .from('teams')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Team;
    },

    /**
     * Delete a team
     * @param id 
     * @returns 
     */
    async deleteTeam(id: string) {
        const { error } = await supabaseAdmin
            .from('teams')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    /**
     * Increment members count for a team
     * @param teamId 
     */
    async incrementMembersCount(teamId: string) {
        try {
            const { data } = await supabaseAdmin
                .from('teams')
                .select('members_count')
                .eq('id', teamId)
                .single();
            const currentCount = data?.members_count || 0;
            await supabaseAdmin
                .from('teams')
                .update({ members_count: currentCount + 1 })
                .eq('id', teamId);
        } catch (err) {
            console.error('Error incrementing members count:', err);
        }
    },

    /**
     * Decrement members count for a team
     * @param teamId 
     */
    async decrementMembersCount(teamId: string) {
        try {
            const { data } = await supabaseAdmin
                .from('teams')
                .select('members_count')
                .eq('id', teamId)
                .single();
            const currentCount = data?.members_count || 0;
            await supabaseAdmin
                .from('teams')
                .update({ members_count: Math.max(0, currentCount - 1) })
                .eq('id', teamId);
        } catch (err) {
            console.error('Error decrementing members count:', err);
        }
    },

    /**
     * Delegates to AuthRepository.listUsers(), which reads auth.users directly.
     * The previous Auth API call silently capped at the first 1000 users.
     */
    async listUsers() {
        return AuthRepository.listUsers();
    },

    async updateUser(userId: string, attributes: any) {
        return supabaseAdmin.auth.admin.updateUserById(userId, attributes);
    },
};