import { IService } from '../interfaces';
import { serviceRepository, teamRepository } from '../repositories';

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
        const teams = await teamRepository.listTeams();

        const enrichedTeams = await Promise.all(
            teams.map(async (team) => {
                let services: { id: string; name: string }[] = [];

                if (team.service_ids && team.service_ids.length > 0) {
                    services = await teamRepository.getServicesByIds(team.service_ids);
                }

                // Return team with services array (only id and name)
                return {
                    ...team,
                    services: services.map(service => ({
                        id: service.id,
                        name: service.name
                    })),
                    service_names: services.map(s => s.name).join(', '),
                    service_count: services.length
                };
            })
        );

        return enrichedTeams;
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
