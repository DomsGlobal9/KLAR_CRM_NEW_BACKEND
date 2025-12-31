import { supabase, supabaseAdmin } from '../config';
import { userRepository } from '../repositories';


export class UserSyncService {

    /**
     * Sync user from custom table to Supabase Auth
     * This should be called when creating users
     */
    async syncUserToAuth(email: string, password: string, metadata?: any): Promise<any> {
        try {
            const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();

            if (checkError) {
                console.error('Error checking existing users:', checkError);
                throw checkError;
            }

            const authUserExists = existingUsers?.users?.some(user =>
                user.email === email
            );

            if (authUserExists) {
                console.log(`User ${email} already exists in Auth system`);
                return { exists: true };
            }

            const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true, 
                user_metadata: metadata || {}
            });

            if (createError) {
                console.error('Error creating user in Auth:', createError);
                throw createError;
            }

            console.log(`✅ User created in Auth: ${email}`);
            return {
                user: authUser.user,
            };
        } catch (error) {
            console.error('User sync failed:', error);
            throw error;
        }
    }

    /**
     * Sync password between systems
     */
    async syncPassword(userId: string, password: string): Promise<void> {
        try {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password }
            );

            if (error) {
                console.error('Error updating password in Auth:', error);
                throw error;
            }

            console.log(`✅ Password updated for user: ${userId}`);
        } catch (error) {
            console.error('Password sync failed:', error);
            throw error;
        }
    }

    /**
     * Get user's Auth ID by email
     */
    async getAuthUserIdByEmail(email: string): Promise<string | null> {
        try {
            const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

            if (error) {
                console.error('Error listing users:', error);
                return null;
            }

            const user = users?.users?.find(u => u.email === email);
            return user?.id || null;
        } catch (error) {
            console.error('Error getting auth user ID:', error);
            return null;
        }
    }

    /**
     * Batch sync existing users (for migration)
     */
    async batchSyncExistingUsers(): Promise<{ success: number; failed: number }> {
        try {
            const allUsers = await userRepository.getAllUsers();
            let success = 0;
            let failed = 0;

            for (const user of allUsers) {
                try {
                    await this.syncUserToAuth(user.email, 'TempPassword123!', {
                        custom_id: user.id,
                        username: user.username,
                        role: user.role
                    });
                    success++;
                } catch (error) {
                    console.error(`Failed to sync user ${user.email}:`, error);
                    failed++;
                }
            }

            return { success, failed };
        } catch (error) {
            console.error('Batch sync failed:', error);
            throw error;
        }
    }
}

export const userSyncService = new UserSyncService();