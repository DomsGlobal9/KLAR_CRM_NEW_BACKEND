import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { supabaseAdmin } from '../config';
import { userSyncService } from './user-sync.service';
import { userRepository } from '../repositories/user.repository';
import {
    User,
    CreateUserInput,
    UpdateUserInput,
    ChangePasswordInput,
    AdminRMAssignment
} from '../models/user.model';
import {
    formatAuthUser,
    getUserById,
    getUserByEmail,
    getUserByUsername,
    createAuditLog,
} from '../helpers';

export const userService = {

    /**
     * Password handling
     * @param password 
     * @returns 
     */
    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    },

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    },

    /**
     * User operations
     * @param userData 
     * @param createdBy 
     * @returns 
     */
    async createUser(userData: any, createdBy?: string): Promise<any> {
        if (createdBy) {
            // Get creator info from Supabase Auth
            const creator = await getUserById(createdBy);
            if (!creator) throw new Error('Creator not found');

            if (creator.role === 'rm') throw new Error('RMs cannot create users');
            if (creator.role === 'admin' && userData.role === 'superadmin') {
                throw new Error('Admins cannot create superadmins');
            }
        }

        /**
         * Check if email already exists in Supabase Auth
         */
        const existingUser = await getUserByEmail(userData.email);
        if (existingUser) throw new Error('Email already registered');

        /**
         * Create user directly in Supabase Auth with all metadata
         */
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true, // Auto-confirm
            user_metadata: {
                username: userData.username,
                role: userData.role,
                full_name: userData.full_name || null,
                phone: userData.phone || null,
                profile_image_url: userData.profile_image_url || null,
                assigned_under: userData.assigned_under || null,
                department: userData.department || null,
                notes: userData.notes || null,
                status: 'active',
                assigned_leads_count: 0,
                created_by: createdBy || null,
                last_login_at: null
            }
        });

        if (authError) {
            console.error('Failed to create user in Auth:', authError);
            throw new Error(`Failed to create user: ${authError.message}`);
        }

        console.log(`✅ User created in Supabase Auth: ${userData.email}`);

        /**
         * Create audit log using the new Auth user ID
         */
        await createAuditLog({
            user_id: createdBy,
            action: 'USER_CREATED',
            entity_type: 'user',
            entity_id: authUser.user.id,
            new_values: {
                id: authUser.user.id,
                email: userData.email,
                role: userData.role,
                created_by: createdBy
            }
        });

        return {
            id: authUser.user.id,
            email: userData.email,
            username: userData.username,
            role: userData.role,
            status: 'active',
            ...authUser.user.user_metadata
        };
    },

    async updateUserProfile(id: string, updates: UpdateUserInput, updatedBy?: string): Promise<User> {
        const user = await userRepository.getUserById(id);
        if (!user) throw new Error('User not found');

        /**
         * Check permissions (users can only update their own profile or superadmin can update anyone)
         */
        if (updatedBy && updatedBy !== id) {
            const updater = await userRepository.getUserById(updatedBy);
            if (!updater || updater.role !== 'superadmin') {
                throw new Error('Not authorized to update this user');
            }
        }

        const oldValues = { ...user };
        const updatedUser = await userRepository.updateUser(id, updates);

        /**
         * Log the action
         */
        await userRepository.createAuditLog({
            user_id: updatedBy,
            action: 'USER_UPDATED',
            entity_type: 'user',
            entity_id: id,
            old_values: oldValues,
            new_values: updatedUser
        });

        return updatedUser;
    },

    async changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
        const user = await userRepository.getUserById(userId);
        if (!user) throw new Error('User not found');

        /**
         * Verify current password
         */
        const isValid = await this.verifyPassword(data.currentPassword, user.password_hash);
        if (!isValid) throw new Error('Current password is incorrect');

        /**
         * Hash new password
         */
        const newHash = await this.hashPassword(data.newPassword);

        /**
         * Update password
         */
        await userRepository.updatePassword(userId, newHash);

        /**
         * Log the action
         */
        await userRepository.createAuditLog({
            user_id: userId,
            action: 'PASSWORD_CHANGED',
            entity_type: 'user',
            entity_id: userId
        });
    },

    async deleteUser(userId: string, deletedBy?: string): Promise<void> {
        const user = await userRepository.getUserById(userId);
        if (!user) throw new Error('User not found');

        /**
         * Check permissions
         */
        if (deletedBy) {
            const deleter = await userRepository.getUserById(deletedBy);
            if (!deleter) throw new Error('Deleter not found');

            if (deleter.role !== 'superadmin') {
                throw new Error('Only superadmins can delete users');
            }

            if (user.role === 'superadmin' && deleter.id === userId) {
                throw new Error('Superadmins cannot delete themselves');
            }
        }

        /**
         * Log before deletion
         */
        await userRepository.createAuditLog({
            user_id: deletedBy,
            action: 'USER_DELETED',
            entity_type: 'user',
            entity_id: userId,
            old_values: user
        });

        await userRepository.deleteUser(userId);
    },

    /**
     * Admin-RM Assignment operations
     * @param adminId 
     * @param rmId 
     * @param assignedBy 
     * @returns 
     */
    async assignRMToAdmin(adminId: string, rmId: string, assignedBy: string): Promise<AdminRMAssignment> {
        /**
         * Verify all users exist and have correct roles
         */
        const [admin, rm, assigner] = await Promise.all([
            userRepository.getUserById(adminId),
            userRepository.getUserById(rmId),
            userRepository.getUserById(assignedBy)
        ]);

        if (!admin || admin.role !== 'admin') throw new Error('Invalid admin');
        if (!rm || rm.role !== 'rm') throw new Error('Invalid RM');
        if (!assigner || (assigner.role !== 'superadmin' && assigner.id !== adminId)) {
            throw new Error('Not authorized to assign RMs');
        }

        const assignment = await userRepository.assignRMToAdmin(adminId, rmId, assignedBy);

        /**
         * Log the action
         */
        await userRepository.createAuditLog({
            user_id: assignedBy,
            action: 'RM_ASSIGNED',
            entity_type: 'admin_rm_assignment',
            entity_id: assignment.id,
            new_values: { admin_id: adminId, rm_id: rmId }
        });

        return assignment;
    },

    async removeRMFromAdmin(adminId: string, rmId: string, removedBy: string): Promise<void> {
        const remover = await userRepository.getUserById(removedBy);
        if (!remover) throw new Error('Remover not found');

        if (remover.role !== 'superadmin' && remover.id !== adminId) {
            throw new Error('Not authorized to remove RMs');
        }

        await userRepository.removeRMFromAdmin(adminId, rmId);

        /**
         * Log the action
         */
        await userRepository.createAuditLog({
            user_id: removedBy,
            action: 'RM_REMOVED',
            entity_type: 'admin_rm_assignment',
            entity_id: `${adminId}-${rmId}`,
            old_values: { admin_id: adminId, rm_id: rmId }
        });
    },

    async getAdminAssignments(adminId: string): Promise<AdminRMAssignment[]> {
        return userRepository.getAdminAssignments(adminId);
    },

    async getRMAdmins(rmId: string): Promise<AdminRMAssignment[]> {
        return userRepository.getRMAdmins(rmId);
    },

    /**
     * User listing
     * @param role 
     * @param requesterId 
     * @returns 
     */
    async getAllUsers(role?: string, requesterId?: string): Promise<User[]> {
        if (requesterId) {
            const requester = await userRepository.getUserById(requesterId);
            if (!requester) throw new Error('Requester not found');

            /**
             * Role-based filtering
             */
            switch (requester.role) {
                // Can see all users
                case 'superadmin':
                    break;

                // Can only see admins and RMs
                case 'admin':
                    if (role && !['admin', 'rm'].includes(role)) {
                        throw new Error('Admins can only view admin and RM users');
                    }
                    break;

                // Can only see themselves
                case 'rm':
                    if (requesterId) {
                        const user = await userRepository.getUserById(requesterId);
                        return user ? [user] : [];
                    }
                    break;
            }
        }

        return userRepository.getAllUsers(role);
    },

    /**
     * Password reset
     * @param email 
     * @returns 
     */
    async initiatePasswordReset(email: string): Promise<string> {
        const user = await userRepository.getUserByEmail(email);
        if (!user) throw new Error('User not found');

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        await userRepository.createPasswordResetToken(user.id, token, expiresAt);

        // In production, send email here
        console.log(`Password reset token for ${email}: ${token}`);

        return token;
    },

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const tokenData = await userRepository.getPasswordResetToken(token);

        if (!tokenData) throw new Error('Invalid or expired token');
        if (tokenData.used) throw new Error('Token already used');
        if (new Date(tokenData.expires_at) < new Date()) {
            throw new Error('Token expired');
        }

        // Hash new password
        const newHash = await this.hashPassword(newPassword);

        // Update password
        await userRepository.updatePassword(tokenData.user_id, newHash);

        // Mark token as used
        await userRepository.markTokenAsUsed(tokenData.id);

        // Log the action
        await userRepository.createAuditLog({
            user_id: tokenData.user_id,
            action: 'PASSWORD_RESET',
            entity_type: 'user',
            entity_id: tokenData.user_id
        });
    },

    /**
     * Statistics
     * @returns 
     */
    async getUserStats(): Promise<any> {
        const [superadminCount, adminCount, rmCount] = await Promise.all([
            userRepository.getSuperadminCount(),
            userRepository.getActiveAdmins().then(admins => admins.length),
            userRepository.getActiveRMs().then(rms => rms.length)
        ]);

        return {
            superadminCount,
            adminCount,
            rmCount,
            totalUsers: superadminCount + adminCount + rmCount
        };
    },

    /**
     * Update last login
     * @param userId 
     */
    async updateLastLogin(userId: string): Promise<void> {
        await userRepository.updateUser(userId, {
            last_login_at: new Date()
        });
    }
};