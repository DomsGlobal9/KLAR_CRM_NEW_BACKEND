import { teamRepository, AuthRepository } from '../repositories';
import { teamMemberService } from './teamMember.service';

export const teamService = {

    /**
     * Create a new team
     * @param payload 
     * @returns 
     */
    async createTeam(payload: {
        name: string;
        description?: string;
        member_ids?: string[];
    }) {
        try {
            const team = await teamRepository.createTeam(
                payload.name,
                payload.description
            );

            if (payload.member_ids && Array.isArray(payload.member_ids) && payload.member_ids.length > 0) {
                for (const memberId of payload.member_ids) {
                    try {
                        await teamMemberService.updateTeamMember(memberId, { team_id: team.id });
                    } catch (memberErr) {
                        console.error(`Error assigning member ${memberId} to team ${team.id}:`, memberErr);
                    }
                }
            }

            return await teamRepository.getTeamById(team.id);
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
            member_ids?: string[];
        }
    ) {
        if (payload.member_ids !== undefined && Array.isArray(payload.member_ids)) {
            const { data } = await AuthRepository.listUsers();
            const usersList = data?.users || [];
            const currentMembers = usersList || [];
            const getMemberTeamId = (u: any) => {
                const meta = u.user_metadata?.user_metadata || u.user_metadata || {};
                return meta.team_id || meta.teamId || u.team_id || u.teamId;
            };

            const currentTeamMembers = currentMembers.filter((u: any) => getMemberTeamId(u) === id);
            const currentTeamMemberIds = currentTeamMembers.map((u: any) => u.id);

            const membersToRemove = currentTeamMemberIds.filter((mId: string) => !payload.member_ids!.includes(mId));
            for (const mId of membersToRemove) {
                try {
                    await teamMemberService.updateTeamMember(mId, { team_id: null });
                } catch (err) {
                    console.error(`Error removing member ${mId} from team ${id}:`, err);
                }
            }

            for (const mId of payload.member_ids) {
                if (!currentTeamMemberIds.includes(mId)) {
                    try {
                        await teamMemberService.updateTeamMember(mId, { team_id: id });
                    } catch (err) {
                        console.error(`Error adding member ${mId} to team ${id}:`, err);
                    }
                }
            }
        }

        const updateData: { name?: string; description?: string; is_active?: boolean } = {};
        if (payload.name !== undefined) updateData.name = payload.name;
        if (payload.description !== undefined) updateData.description = payload.description;
        if (payload.is_active !== undefined) updateData.is_active = payload.is_active;

        if (Object.keys(updateData).length > 0) {
            await teamRepository.updateTeam(id, updateData);
        }

        return await teamRepository.getTeamById(id);
    },

    /**
     * Delete a team
     * @param id 
     * @param requester 
     * @returns 
     */
    async deleteTeam(id: string, requester: any) {
        if (requester?.role_name !== 'SUPERADMIN') {
            throw new Error('Unauthorized: Only SUPERADMIN can delete teams');
        }
        return await teamRepository.deleteTeam(id);
    }
};
