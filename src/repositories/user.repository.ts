import { supabase, supabaseAdmin } from '../config';
import {
    User,
    CreateUserInput,
    UpdateUserInput,
    AdminRMAssignment,
    AuditLog
} from '../models';

export const userRepository = {

    /**
     * User creation
     * @param userData 
     * @returns 
     */
    async createUser(userData: any): Promise<User> {
        if (userData.role === 'superadmin') {
            const { count, error: countError } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'superadmin')
                .eq('status', 'active');

            if (countError) throw countError;

            if (count && count >= 2) {
                throw new Error('Maximum 2 superadmins allowed');
            }
        }

        const { password, ...safeUserData } = userData;

        const insertPayload = {
            ...safeUserData,
            password_hash: userData.password_hash,
            status: 'active',
            assigned_leads_count: 0,
        };

        const { data, error } = await supabaseAdmin
            .from('users')
            .insert(insertPayload)
            .select()
            .single();

        if (error) throw error;
        return data;
    },



    /**
     * Get user details by user id
     * @param id 
     * @returns 
     */
    async getUserById(id: string): Promise<User | null> {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    },

    /**
     * Get user details by user email
     * @param email 
     * @returns 
     */
    async getUserByEmail(email: string): Promise<User | null> {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) return null;
        return data;
    },

    /**
     * Get user details by username
     * @param username 
     * @returns 
     */
    async getUserByUsername(username: string): Promise<User | null> {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error) return null;
        return data;
    },

    /**
     * Update user details
     * @param id 
     * @param updates 
     * @returns 
     */
    async updateUser(id: string, updates: UpdateUserInput): Promise<User> {
        const { data, error } = await supabaseAdmin
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * User Password update
     * @param id 
     * @param newPasswordHash 
     */
    async updatePassword(id: string, newPasswordHash: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('users')
            .update({ password_hash: newPasswordHash })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Delete user
     * @param id 
     */
    async deleteUser(id: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get all user details
     * @param role 
     * @returns 
     */
    async getAllUsers(role?: string): Promise<User[]> {
        let query = supabaseAdmin
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (role) {
            query = query.eq('role', role);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /**
     * Get user by their assigned user
     * @param assignedUnderId 
     * @returns 
     */
    async getUsersByAssignedUnder(assignedUnderId: string): Promise<User[]> {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('assigned_under', assignedUnderId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Admin-RM Assignment operations
     * @param adminId 
     * @param rmId 
     * @param assignedBy 
     * @returns 
     */
    async assignRMToAdmin(adminId: string, rmId: string, assignedBy: string): Promise<AdminRMAssignment> {
        const { data, error } = await supabaseAdmin
            .from('admin_rm_assignments')
            .insert({
                admin_id: adminId,
                rm_id: rmId,
                assigned_by: assignedBy,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Remove RM from admin
     * @param adminId 
     * @param rmId 
     */
    async removeRMFromAdmin(adminId: string, rmId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('admin_rm_assignments')
            .delete()
            .eq('admin_id', adminId)
            .eq('rm_id', rmId);

        if (error) throw error;
    },

    /**
     * Get Admin assignment
     * @param adminId 
     * @returns 
     */
    async getAdminAssignments(adminId: string): Promise<AdminRMAssignment[]> {
        const { data, error } = await supabaseAdmin
            .from('admin_rm_assignments')
            .select('*')
            .eq('admin_id', adminId)
            .eq('status', 'active');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get Admin by RM
     * @param rmId 
     * @returns 
     */
    async getRMAdmins(rmId: string): Promise<AdminRMAssignment[]> {
        const { data, error } = await supabaseAdmin
            .from('admin_rm_assignments')
            .select('*')
            .eq('rm_id', rmId)
            .eq('status', 'active');

        if (error) throw error;
        return data || [];
    },

    /**
     * Audit log operations
     * @param logData 
     * @returns 
     */
    async createAuditLog(logData: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
        const { data, error } = await supabaseAdmin
            .from('audit_logs')
            .insert(logData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get Audit log
     * @param userId 
     * @param limit 
     * @returns 
     */
    async getAuditLogs(userId?: string, limit = 100): Promise<AuditLog[]> {
        let query = supabaseAdmin
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /**
     * Password reset operations
     * @param userId 
     * @param token 
     * @param expiresAt 
     */
    async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
        const { error } = await supabaseAdmin
            .from('password_reset_tokens')
            .insert({
                user_id: userId,
                token,
                expires_at: expiresAt.toISOString(),
                used: false
            });

        if (error) throw error;
    },

    /**
     * Get password_hash reset token
     * @param token 
     * @returns 
     */
    async getPasswordResetToken(token: string): Promise<any> {
        const { data, error } = await supabaseAdmin
            .from('password_reset_tokens')
            .select('*')
            .eq('token', token)
            .single();

        if (error) return null;
        return data;
    },

    /**
     * Mark token as used
     * @param tokenId 
     */
    async markTokenAsUsed(tokenId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('password_reset_tokens')
            .update({ used: true })
            .eq('id', tokenId);

        if (error) throw error;
    },

    /**
     * Role-based queries
     * @returns 
     */
    async getSuperadminCount(): Promise<number> {
        console.log("Entered into Repository for superadmin count");

        try {
            const { count, error } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'superadmin')
                .eq('status', 'active');

            console.log("THe count we get from repository", count);
            console.log("The error we get", error);

            if (error) {
                console.error("Supabase error:", error);
                throw error;
            }

            return count || 0;
        } catch (error) {
            console.error("Error in getSuperadminCount:", error);
            throw error;
        }
    },

    /**
     * Get active admins
     * @returns 
     */
    async getActiveAdmins(): Promise<User[]> {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('role', 'admin')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get active RMs
     * @returns 
     */
    async getActiveRMs(): Promise<User[]> {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('role', 'rm')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};