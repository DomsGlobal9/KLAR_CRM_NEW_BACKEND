import { supabaseAdmin } from '../config';
import { User } from '../models/user.model';

export const userRepository = {

    /**
     * Update user metadata
     * @param userId 
     * @param metadata 
     * @returns 
     */
    async updateUserMetadata(userId: string, metadata: any) {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { user_metadata: metadata }
        );
        if (error) throw error;
        return data;
    },

    /**
     * Update user email
     * @param userId 
     * @param email 
     * @returns 
     */
    async updateUserEmail(userId: string, email: string) {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { email }
        );
        if (error) throw error;
        return data;
    },

    /**
     * List all users
     * @returns 
     */
    async listUsers() {
        return supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    },

    /**
     * Get user by ID
     * @param userId 
     * @returns
     */
    async getById(userId: string) {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (error) throw error;

        const user = data.user;

        let teamName: string | null = null;
        const teamId = user.user_metadata?.team_id;

        if (teamId) {
            const { data: team, error: teamError } =
                await supabaseAdmin
                    .from('teams')
                    .select('name')
                    .eq('id', teamId)
                    .single();

            if (teamError && teamError.code !== 'PGRST116') {
                throw teamError;
            }

            teamName = team?.name ?? null;
        }

        return {
            id: user.id,
            email: user.email || null,
            username: user.user_metadata?.username || null,
            role: user.user_metadata?.role_name || null,
            full_name: user.user_metadata?.full_name || null,
            gender: user.user_metadata?.gender || null,
            phone: user.phone || user.user_metadata?.phone || null,
            dob: user.user_metadata?.dob || null,
            status: user.user_metadata?.status || null,
            team_id: user.user_metadata?.team_id || null,
            team_name: teamName,
            image: user.user_metadata?.image || null,
            created_at: user.created_at || null,
            updated_at: user.updated_at || null
        };
    }
};