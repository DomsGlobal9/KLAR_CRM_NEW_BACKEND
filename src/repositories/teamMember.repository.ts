import { supabaseAdmin } from '../config';
import { AuthRepository } from './auth.repository';
import { getUserByEmail, getUserByUsername } from '../helpers';

export const teamMemberRepository = {
    /**
     * Delegates to AuthRepository.listUsers(), which reads auth.users directly.
     * The previous Auth API call silently capped at the first 1000 users.
     */
    async listUsers() {
        return AuthRepository.listUsers();
    },
 
    async createUser(payload: any) { 
        return supabaseAdmin.auth.admin.createUser(payload);
    },

    async updateUser(userId: string, metadata: any) {
        return supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: metadata
        });
    },

    async deleteUser(userId: string) {
        return supabaseAdmin.auth.admin.deleteUser(userId);
    },

    async getUserByEmail(email: string) {
        return getUserByEmail(email);
    },

    async getUserByUsername(username: string) {
        return getUserByUsername(username);
    },

    /**
     * Find the team lead for a team.
     *
     * Was: fetch the first 1000 users and scan them in memory — so past user
     * 1000 a team's lead could simply not be found. Now the filter runs in the
     * database and returns at most one row.
     */
    async findTLByTeam(teamId: string) {
        return AuthRepository.findUserByMetadata({ role_name: 'tl', team_id: teamId });
    },

    async getUserById(userId: string) {

        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (error) throw error;

        return data.user;
    },

};

