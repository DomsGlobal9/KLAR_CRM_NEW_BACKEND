import { supabase, supabaseAdmin } from '../config';

export const AuthRepository = {

    async listUsers() {
        return supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    },

    async createUser(payload: any) {
        return supabaseAdmin.auth.admin.createUser(payload);
    },

    async updateMetadata(userId: string, metadata: any) {
        return supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: metadata,
        });
    },

    async signIn(email: string, password: string) {
        console.log("&&&&&&&&&&&&& Email and password get in repository", { email, password });
        return supabase.auth.signInWithPassword({ email, password });
    },

    async refresh(refresh_token: string) {
        return supabase.auth.refreshSession({ refresh_token });
    },

    async revokeSessions(userId: string) {
        return supabaseAdmin.auth.admin.signOut(userId);
    },

    /**
     * Get username by user ID using direct SQL query
     */
    async getUsernameById(userId: string): Promise<string | null> {
        try {
            const { data, error } =
                await supabaseAdmin.auth.admin.getUserById(userId);

            if (error || !data?.user) {
                console.error(
                    `❌ Error fetching user ${userId}:`,
                    error?.message
                );
                return null;
            }

            const meta = data.user.user_metadata;

            return meta?.username || meta?.full_name || null;

        } catch (error: any) {
            console.error(
                `❌ Exception in getUsernameById for user ${userId}:`,
                error.message
            );
            return null;
        }
    },


    /**
     * Get multiple usernames by IDs using direct SQL query (more efficient)
     */
    async getUsernamesByIdsSql(userIds: string[]): Promise<Map<string, string | null>> {
        try {
            const { data, error } = await supabaseAdmin
                .from('auth.users')
                .select('id, raw_user_meta_data')
                .in('id', userIds);

            if (error) {
                console.error(`❌ Error fetching users:`, error.message);
                return new Map();
            }

            const userMap = new Map<string, string | null>();

            if (data && Array.isArray(data)) {
                data.forEach(user => {
                    const username = user.raw_user_meta_data?.username || null;
                    userMap.set(user.id, username);
                });
            }

            // Handle any missing users
            userIds.forEach(userId => {
                if (!userMap.has(userId)) {
                    userMap.set(userId, null);
                }
            });

            return userMap;

        } catch (error: any) {
            console.error(`❌ Exception in getUsernamesByIdsSql:`, error.message);
            return new Map();
        }
    },
};
