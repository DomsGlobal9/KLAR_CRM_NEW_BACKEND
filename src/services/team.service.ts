import { teamRepository } from '../repositories';

export const teamService = {

    /**
     * Create a new team
     * @param payload 
     * @returns 
     */
    async createTeam(payload: {
        name: string;
        description?: string;
    }) {
        try {
            return await teamRepository.createTeam(
                payload.name,
                payload.description
            );
        } catch (error: any) {
            throw error;
        }
    },

    /**
     * List all teams
     * @returns 
     */
    async listTeams() {
        return await teamRepository.listTeams();
    },

    /**
     * Get team by ID
     * @param id
     * @returns 
     */
    async getTeamById(id: string) {
        return await teamRepository.getTeamById(id);
    },

    /**
     * Update team details
     * @param id 
     * @param payload 
     * @returns 
     */
    async updateTeam(
        id: string,
        payload: {
            name?: string;
            description?: string;
            is_active?: boolean;
        }
    ) {
        return await teamRepository.updateTeam(id, payload);
    },

    /**
     * Delete a team
     * @param id 
     * @param requester 
     * @returns 
     */
    async deleteTeam(id: string, requester: any) {
        if (requester?.role_name !== 'superadmin') {
            throw new Error('Unauthorized: Only superadmin can delete teams');
        }
        return await teamRepository.deleteTeam(id);
    }
};
