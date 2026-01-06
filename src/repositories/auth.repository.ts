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
};
