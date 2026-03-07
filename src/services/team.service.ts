import { teamRepository } from '../repositories';

export const teamService = {

    /**
     * Create a new team
     * @param payload 
     * @param requester 
     * @returns 
     */
    async createTeam(payload: {
        name: string;
        description?: string;
        service_ids?: string[]
    }) {
        try {
            return await teamRepository.createTeam(
                payload.name,
                payload.description,
                payload.service_ids || []
            );
        } catch (error: any) {
            if (error.message?.includes('already assigned to other teams')) {
                throw new Error(`Cannot create team: ${error.message}`);
            }
            throw error;
        }
    },

    /**
     * Get team by ID
     * @returns 
     */
    async listTeams() {
        return teamRepository.listTeams();
    },

    async getTeamById(id: string) {
        return teamRepository.getTeamById(id);
    },

    /**
     * 
     * @param id 
     * @param payload 
     * @param requester 
     * @returns 
     */
    async updateTeam(
        id: string,
        payload: {
            name?: string;
            description?: string;
            is_active?: boolean;
        }) {
        return teamRepository.updateTeam(id, payload);
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
        return teamRepository.deleteTeam(id);
    }
};
