import { supabaseAdmin } from '../config';

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
        return data.user;
    },

};
