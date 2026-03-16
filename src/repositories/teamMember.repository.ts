import { supabaseAdmin } from '../config';
import { getUserByEmail, getUserByUsername } from '../helpers';

export const teamMemberRepository = {
    async listUsers() {
        return supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
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

    async findTLByTeam(teamId: string) {

        const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000
        });

        if (error) throw error;

        return usersData.users.find(u => {
            const meta = u.user_metadata || {};
            return meta.role_name === 'tl' && meta.team_id === teamId;
        }) || null;
    },

    async getUserById(userId: string) {

        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (error) throw error;

        return data.user;
    },

};

