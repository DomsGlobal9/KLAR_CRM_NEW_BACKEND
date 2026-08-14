import { db } from '../db/drizzle';
import { users } from '../db/schema';
import { eq, sql, inArray, desc } from 'drizzle-orm';

const USERNAME_CACHE_TTL_MS = 60_000;
const usernameCache = new Map<string, { username: string | null; expiresAt: number }>();

const readUsernameCache = (userId: string): { hit: boolean; username: string | null } => {
    const entry = usernameCache.get(userId);
    if (!entry) return { hit: false, username: null };
    if (entry.expiresAt < Date.now()) {
        usernameCache.delete(userId);
        return { hit: false, username: null };
    }
    return { hit: true, username: entry.username };
};

const writeUsernameCache = (userId: string, username: string | null): void => {
    usernameCache.set(userId, {
        username,
        expiresAt: Date.now() + USERNAME_CACHE_TTL_MS,
    });
};

/**
 * Reshape a public.users database row into compatible format for existing callers
 */
export interface AuthUser {
    id: string;
    email?: string;
    phone?: string;
    user_metadata: {
        username?: string | null;
        full_name?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        role_id?: string | null;
        role_name?: string | null;
        team_id?: string | null;
        department?: string | null;
        phone?: string | null;
        status?: string;
        image?: string | null;
        [key: string]: any;
    };
    app_metadata: Record<string, any>;
    created_at: any;
    updated_at: any;
    last_sign_in_at: any;
    email_confirmed_at: any;
}

export const toAuthUser = (row: any): AuthUser | null => {
    if (!row) return null;
    return {
        id: row.id,
        email: row.email ?? undefined,
        phone: row.phone ?? undefined,
        user_metadata: {
            username: row.username ?? null,
            full_name: row.fullName ?? row.full_name ?? null,
            first_name: row.firstName ?? row.first_name ?? null,
            last_name: row.lastName ?? row.last_name ?? null,
            role_id: row.roleId ?? row.role_id ?? null,
            role_name: row.role_name || (row.roleId || row.role_id ? 'SUPERADMIN' : 'SUPERADMIN'),
            team_id: row.teamId ?? row.team_id ?? null,
            department: row.department ?? null,
            phone: row.phone ?? null,
            status: (row.isActive ?? row.is_active ?? true) ? 'active' : 'inactive',
            image: row.image ?? null,
        },
        app_metadata: {},
        created_at: row.createdAt ?? row.created_at ?? null,
        updated_at: row.updatedAt ?? row.updated_at ?? null,
        last_sign_in_at: row.lastLoginAt ?? row.last_login_at ?? null,
        email_confirmed_at: row.createdAt ?? row.created_at ?? null,
    };
};

export const AuthRepository = {

    invalidateUsernameCache(userIds?: string | string[]): void {
        if (!userIds) {
            usernameCache.clear();
            return;
        }
        for (const userId of Array.isArray(userIds) ? userIds : [userIds]) {
            usernameCache.delete(userId);
        }
    },

    async listUsers(): Promise<{
        data: { users: any[] };
        error: { message: string } | null;
    }> {
        try {
            const rows = await db.select().from(users).orderBy(desc(users.createdAt));
            return { data: { users: rows.map(toAuthUser) }, error: null };
        } catch (err: any) {
            console.error('❌ listUsers failed:', err.message);
            return { data: { users: [] }, error: { message: err.message } };
        }
    },

    async findUserByMetadata(criteria: Record<string, string>): Promise<any | null> {
        if (!criteria || Object.keys(criteria).length === 0) return null;
        try {
            const rows = await db.select().from(users);
            const found = rows.find(r => {
                const meta: Record<string, any> = toAuthUser(r)?.user_metadata || {};
                return Object.entries(criteria).every(([k, v]) => meta[k] === v);
            });
            return found ? toAuthUser(found) : null;
        } catch (err: any) {
            console.error('❌ findUserByMetadata failed:', err.message);
            return null;
        }
    },

    async createUser(payload: {
        email: string;
        password_hash: string;
        username?: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        role_id?: string;
        team_id?: string;
        department?: string;
        is_active?: boolean;
    }) {
        const [inserted] = await db.insert(users).values({
            email: payload.email.toLowerCase(),
            passwordHash: payload.password_hash,
            username: payload.username ?? null,
            fullName: payload.full_name ?? null,
            firstName: payload.first_name ?? null,
            lastName: payload.last_name ?? null,
            phone: payload.phone ?? null,
            roleId: payload.role_id ?? null,
            teamId: payload.team_id ?? null,
            department: payload.department ?? null,
            isActive: payload.is_active ?? true,
        }).returning();

        return {
            data: { user: toAuthUser(inserted) },
            error: null,
        };
    },

    async updateMetadata(userId: string, metadata: any) {
        const updateData: Record<string, any> = {
            updatedAt: new Date(),
        };

        if (metadata.username !== undefined) updateData.username = metadata.username;
        if (metadata.full_name !== undefined) updateData.fullName = metadata.full_name;
        if (metadata.first_name !== undefined) updateData.firstName = metadata.first_name;
        if (metadata.last_name !== undefined) updateData.lastName = metadata.last_name;
        if (metadata.phone !== undefined) updateData.phone = metadata.phone;
        if (metadata.role_id !== undefined) updateData.roleId = metadata.role_id;
        if (metadata.team_id !== undefined) updateData.teamId = metadata.team_id;
        if (metadata.department !== undefined) updateData.department = metadata.department;
        if (metadata.image !== undefined) updateData.image = metadata.image;
        if (metadata.status !== undefined) updateData.isActive = metadata.status === 'active';

        const [updated] = await db.update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

        this.invalidateUsernameCache(userId);

        return {
            data: { user: toAuthUser(updated) },
            error: null,
        };
    },

    async getUserByEmail(email: string) {
        try {
            if (!email) return { user: null, error: null };

            const [row] = await db.select()
                .from(users)
                .where(eq(sql`lower(${users.email})`, email.toLowerCase()))
                .limit(1);

            if (!row) return { user: null, error: null };

            return {
                user: toAuthUser(row),
                rawUser: row,
                error: null,
            };
        } catch (err: any) {
            return {
                user: null,
                error: { message: err.message || "Failed to fetch user" }
            };
        }
    },

    async getUserById(userId: string) {
        try {
            if (!userId) return { user: null, error: null };

            const [row] = await db.select()
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (!row) return { user: null, error: null };

            return {
                user: toAuthUser(row),
                rawUser: row,
                error: null,
            };
        } catch (err: any) {
            return {
                user: null,
                error: { message: err.message || "Failed to fetch user" }
            };
        }
    },

    async updateLastLogin(userId: string) {
        try {
            await db.update(users)
                .set({ lastLoginAt: new Date(), updatedAt: new Date() })
                .where(eq(users.id, userId));
        } catch (err: any) {
            console.error('❌ updateLastLogin failed:', err.message);
        }
    },

    async getUsernameById(userId: string): Promise<string | null> {
        if (!userId) return null;
        const usernames = await this.getUsernamesByIds([userId]);
        return usernames.get(userId) ?? null;
    },

    async getUserInfoById(userId: string) {
        try {
            const res = await this.getUserById(userId);
            if (!res.user) return null;

            const meta = res.user.user_metadata;
            return {
                id: res.user.id,
                email: res.user.email ?? '',
                username: meta?.username ?? '',
                full_name: meta?.full_name ?? '',
                role_name: meta?.role_name ?? '',
                team_id: meta?.team_id ?? ''
            };
        } catch {
            return null;
        }
    },

    async getUsernamesByIds(userIds: string[]): Promise<Map<string, string | null>> {
        const userMap = new Map<string, string | null>();
        if (!userIds?.length) return userMap;

        const missingIds: string[] = [];
        for (const userId of new Set(userIds.filter(Boolean))) {
            const cached = readUsernameCache(userId);
            if (cached.hit) {
                userMap.set(userId, cached.username);
            } else {
                missingIds.push(userId);
            }
        }

        if (missingIds.length === 0) return userMap;

        try {
            const rows = await db.select({
                id: users.id,
                username: users.username,
                fullName: users.fullName,
            })
            .from(users)
            .where(inArray(users.id, missingIds));

            for (const row of rows) {
                const username = row.username || row.fullName || null;
                userMap.set(row.id, username);
                writeUsernameCache(row.id, username);
            }
        } catch (error: any) {
            console.error('❌ getUsernamesByIds failed:', error.message);
        }

        for (const userId of missingIds) {
            if (!userMap.has(userId)) userMap.set(userId, null);
        }

        return userMap;
    },

    async getUserSummariesByIds(
        userIds: string[]
    ): Promise<Map<string, { name: string; email: string }>> {
        const summaries = new Map<string, { name: string; email: string }>();
        const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
        if (!uniqueIds.length) return summaries;

        try {
            const rows = await db.select({
                id: users.id,
                email: users.email,
                fullName: users.fullName,
                username: users.username,
            })
            .from(users)
            .where(inArray(users.id, uniqueIds));

            for (const row of rows) {
                summaries.set(row.id, {
                    name: row.fullName || row.username || row.email || 'Team Member',
                    email: row.email || '',
                });
            }
        } catch (error: any) {
            console.error('❌ getUserSummariesByIds failed:', error.message);
        }

        return summaries;
    },

    async getUsernamesByIdsSql(userIds: string[]): Promise<Map<string, string | null>> {
        return this.getUsernamesByIds(userIds);
    },
};
