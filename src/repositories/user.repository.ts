import { db } from '../db/drizzle';
import { users, teams, roles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRepository } from './auth.repository';

export const userRepository = {

    /**
     * Update user metadata
     */
    async updateUserMetadata(userId: string, metadata: any) {
        return AuthRepository.updateMetadata(userId, metadata);
    },

    /**
     * Update user email
     */
    async updateUserEmail(userId: string, email: string) {
        const [updated] = await db.update(users)
            .set({ email: email.toLowerCase(), updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning();
        if (!updated) throw new Error('User not found');
        return { user: updated };
    },

    /**
     * List all users
     */
    async listUsers() {
        return AuthRepository.listUsers();
    },

    /**
     * Get user by ID (safe view, without password_hash)
     */
    async getById(userId: string) {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!user) {
            throw new Error('User not found');
        }

        let teamName: string | null = null;
        if (user.teamId) {
            const [t] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, user.teamId)).limit(1);
            if (t) teamName = t.name;
        }

        let roleName: string | null = null;
        if (user.roleId) {
            const [r] = await db.select({ name: roles.name }).from(roles).where(eq(roles.id, user.roleId)).limit(1);
            if (r) roleName = r.name;
        }

        return {
            id: user.id,
            email: user.email || null,
            username: user.username || null,
            role: roleName,
            role_id: user.roleId || null,
            full_name: user.fullName || null,
            first_name: user.firstName || null,
            last_name: user.lastName || null,
            phone: user.phone || null,
            status: user.isActive ? 'active' : 'inactive',
            is_active: user.isActive,
            team_id: user.teamId || null,
            team_name: teamName,
            department: user.department || null,
            image: user.image || null,
            created_at: user.createdAt || null,
            updated_at: user.updatedAt || null,
            last_login_at: user.lastLoginAt || null,
        };
    }
};