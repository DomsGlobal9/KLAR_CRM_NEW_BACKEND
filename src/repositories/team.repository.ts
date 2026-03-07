import { supabaseAdmin } from '../config';
import { Team } from '../interfaces/team.interface';

export const teamRepository = {

    async validateServiceIds(service_ids: string[], currentTeamId?: string): Promise<void> {
        if (!service_ids || service_ids.length === 0) return;

        const { data: existingTeams, error } = await supabaseAdmin
            .from('teams')
            .select('id, name, service_ids')
            .contains('service_ids', service_ids);

        if (error) throw error;

        const conflictingTeams = currentTeamId
            ? existingTeams?.filter(team => team.id !== currentTeamId)
            : existingTeams;

        if (conflictingTeams && conflictingTeams.length > 0) {
            const assignedServices = conflictingTeams.flatMap(team =>
                team.service_ids.filter((id: string) => service_ids.includes(id))
            );

            throw new Error(`Services ${assignedServices.join(', ')} are already assigned to other teams`);
        }
    },

    /**
     * Create a new team
     * @param name 
     * @param description 
     * @returns 
     */
    async createTeam(name: string, description?: string, service_ids: string[] = []) {
        await this.validateServiceIds(service_ids);

        const { data, error } = await supabaseAdmin
            .from('teams')
            .insert({
                name,
                description,
                members_count: 0,
                service_ids: service_ids
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
            .select('*');
        if (error) throw error;
        return data as Team[];
    },

    /**
     * Update team details
     * @param id 
     * @param updates 
     * @returns 
     */
    async updateTeam(id: string, updates: { name?: string; description?: string; service_ids?: string[] }) {
        if (updates.service_ids) {
            await this.validateServiceIds(updates.service_ids, id);
        }

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
        const { error } = await supabaseAdmin.rpc(
            'increment_team_members_count',
            { p_team_id: teamId }
        );
        if (error) throw error;
    },

    /**
     * Decrement members count for a team
     * @param teamId 
     */
    async decrementMembersCount(teamId: string) {
        const { error } = await supabaseAdmin.rpc(
            'decrement_team_members_count',
            { p_team_id: teamId }
        );
        if (error) throw error;
    },

    async listUsers() {
        return supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    },

    async updateUser(userId: string, attributes: any) {
        return supabaseAdmin.auth.admin.updateUserById(userId, attributes);
    },
};