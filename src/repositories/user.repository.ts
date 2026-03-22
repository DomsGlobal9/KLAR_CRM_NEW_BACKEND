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
        // console.log("&&&&&&&&&& User data we get", user);

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

        console.log("Team name", teamName);

        return {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role_name,
            username: user.user_metadata?.username,
            team_id: user.user_metadata?.team_id,
            team_name: teamName
        };
    }

};

