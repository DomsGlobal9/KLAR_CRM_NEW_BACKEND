import { supabase, supabaseAdmin } from '../config';
import { client } from '../db/drizzle';

/**
 * Short-lived in-process cache for username lookups.
 *
 * Usernames change rarely, but they are read on every list request. Caching them
 * removes the per-request lookup entirely. This is per-instance and will be
 * replaced by a shared Redis cache when we scale out horizontally.
 */
/**
 * An auth.users row as read over the direct Postgres connection.
 */
interface AuthUserRow {
    id: string;
    email: string | null;
    raw_user_meta_data: Record<string, any> | null;
    raw_app_meta_data?: Record<string, any> | null;
    last_sign_in_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    email_confirmed_at: string | null;
    phone?: string | null;
    banned_until?: string | null;
}

/**
 * Reshape a raw row into the object the Supabase Auth API returns, so the ~20
 * call sites that read `user_metadata`, `email`, `id` and friends work
 * unchanged regardless of where the data came from.
 */
const toAuthUser = (row: AuthUserRow) => ({
    id: row.id,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    user_metadata: row.raw_user_meta_data || {},
    app_metadata: row.raw_app_meta_data || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_sign_in_at: row.last_sign_in_at,
    email_confirmed_at: row.email_confirmed_at,
    banned_until: row.banned_until ?? undefined,
});

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

export const AuthRepository = {

    /**
     * Drop cached usernames so the next read reflects updated metadata.
     * Call this after any write that changes a user's username / full_name.
     */
    invalidateUsernameCache(userIds?: string | string[]): void {
        if (!userIds) {
            usernameCache.clear();
            return;
        }

        for (const userId of Array.isArray(userIds) ? userIds : [userIds]) {
            usernameCache.delete(userId);
        }
    },

    /**
     * List every auth user.
     *
     * Was `supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })`,
     * which silently returned only the FIRST 1000 users — no error, no marker,
     * just missing rows. Past that point a user simply stopped existing as far
     * as the ~20 call sites that filter this list in memory were concerned:
     * duplicate-email checks would pass wrongly, team lookups would find
     * nobody, and role listings would come back short.
     *
     * Now one SQL query against auth.users, so the result is complete no matter
     * how many users exist. Returns the same `{ data: { users }, error }` shape
     * the Auth API produced, so no caller needed to change.
     */
    async listUsers(): Promise<{
        data: { users: any[] };
        error: { message: string } | null;
    }> {
        try {
            const rows = await client<AuthUserRow[]>`
                SELECT id, email, raw_user_meta_data, raw_app_meta_data,
                       last_sign_in_at, created_at, updated_at, email_confirmed_at,
                       phone, banned_until
                FROM auth.users
                ORDER BY created_at DESC
            `;

            return { data: { users: rows.map(toAuthUser) }, error: null };
        } catch (err: any) {
            console.error('❌ listUsers failed:', err.message);

            // Callers destructure `data.users` directly, so an empty list is
            // returned alongside the error rather than undefined.
            return { data: { users: [] }, error: { message: err.message } };
        }
    },

    /**
     * Find one user by exact matches on user_metadata fields.
     *
     * Replaces the "list every user, then Array.find() in memory" pattern,
     * which both capped at 1000 users and pulled the whole table across the
     * wire to return a single row.
     */
    async findUserByMetadata(criteria: Record<string, string>): Promise<any | null> {
        const entries = Object.entries(criteria).filter(([, value]) => value != null);

        if (!entries.length) return null;

        try {
            // Build the metadata predicate as a single JSONB containment check,
            // so the values stay parameterised rather than interpolated.
            const match = Object.fromEntries(entries);

            const rows = await client<AuthUserRow[]>`
                SELECT id, email, raw_user_meta_data, raw_app_meta_data,
                       last_sign_in_at, created_at, updated_at, email_confirmed_at,
                       phone, banned_until
                FROM auth.users
                WHERE raw_user_meta_data @> ${JSON.stringify(match)}::jsonb
                LIMIT 1
            `;

            return rows.length ? toAuthUser(rows[0]) : null;
        } catch (err: any) {
            console.error('❌ findUserByMetadata failed:', err.message);
            return null;
        }
    },

    async createUser(payload: any) {
        return supabaseAdmin.auth.admin.createUser(payload);
    },

    async updateMetadata(userId: string, metadata: any) {
        return supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: metadata,
        });
    },
    
    /**
     * Look up a user by email in a single indexed query.
     *
     * Previously walked the entire Auth user list 100 at a time until it found a
     * match — at 100k users that is up to 1000 API calls for one lookup.
     */
    async getUserByEmail(email: string) {
        try {
            if (!email) return { user: null, error: null };

            const rows = await client<{
                id: string;
                email: string | null;
                raw_user_meta_data: Record<string, any> | null;
            }[]>`
                SELECT id, email, raw_user_meta_data
                FROM auth.users
                WHERE lower(email) = lower(${email})
                LIMIT 1
            `;

            if (!rows.length) return { user: null, error: null };

            const row = rows[0];

            return {
                user: {
                    id: row.id,
                    email: row.email,
                    user_metadata: row.raw_user_meta_data || {},
                },
                error: null,
            };

        } catch (err: any) {
            return {
                user: null,
                error: { message: err.message || "Failed to fetch user" }
            };
        }
    },

    async signIn(email: string, password: string) {

        return supabase.auth.signInWithPassword({ email, password });
    },

    async refresh(refresh_token: string) {
        return supabase.auth.refreshSession({ refresh_token });
    },

    async revokeSessions(userId: string) {
        return supabaseAdmin.auth.admin.signOut(userId);
    },

    /**
     * Get username by user ID.
     *
     * Delegates to the batch lookup so a single call path is used everywhere and
     * the result is cached. Prefer getUsernamesByIds() when resolving a list.
     */
    async getUsernameById(userId: string): Promise<string | null> {
        if (!userId) return null;

        const usernames = await this.getUsernamesByIds([userId]);

        return usernames.get(userId) ?? null;
    },

    /**
     * Get user info by ID
     * @param userId 
     * @returns 
     */
    async getUserInfoById(userId: string) {
        try {
            const { data, error } =
                await supabaseAdmin.auth.admin.getUserById(userId);

            if (error || !data?.user) return null;

            const meta = data.user.user_metadata;

            return {
                id: data.user.id,
                email: data.user.email ?? '',
                username: meta?.username ?? '',
                full_name: meta?.full_name ?? '',
                role_name: meta?.role_name ?? '',
                team_id: meta?.team_id ?? ''
            };
        } catch {
            return null;
        }
    },


    /**
     * Resolve many usernames in a single database round trip.
     *
     * Replaces the previous per-user call to supabaseAdmin.auth.admin.getUserById(),
     * which issued one HTTPS request to the Supabase Auth API for every row in a
     * list. Reads auth.users directly over the pooled Postgres connection.
     */
    async getUsernamesByIds(userIds: string[]): Promise<Map<string, string | null>> {
        const userMap = new Map<string, string | null>();

        if (!userIds?.length) return userMap;

        // Dedupe, drop falsy ids, and serve whatever the cache already holds.
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
            const rows = await client<{ id: string; raw_user_meta_data: any }[]>`
                SELECT id, raw_user_meta_data
                FROM auth.users
                WHERE id = ANY(${missingIds}::uuid[])
            `;

            for (const row of rows) {
                const meta = row.raw_user_meta_data || {};
                const username = meta.username || meta.full_name || null;

                userMap.set(row.id, username);
                writeUsernameCache(row.id, username);
            }
        } catch (error: any) {
            console.error('❌ getUsernamesByIds failed:', error.message);
            // Fall through: unresolved ids are returned as null, matching the
            // previous behaviour when a lookup failed.
        }

        // Users that no longer exist (or failed to resolve) map to null.
        for (const userId of missingIds) {
            if (!userMap.has(userId)) userMap.set(userId, null);
        }

        return userMap;
    },

    /**
     * Resolve display name and email for many users in a single query.
     *
     * Same problem as getUsernamesByIds, different fields: callers that render
     * a sender or owner column were calling
     * supabaseAdmin.auth.admin.getUserById() once per row.
     *
     * Name resolution order (full_name → name → email) matches what those call
     * sites did, so rendered output is unchanged.
     */
    async getUserSummariesByIds(
        userIds: string[]
    ): Promise<Map<string, { name: string; email: string }>> {
        const summaries = new Map<string, { name: string; email: string }>();

        const uniqueIds = [...new Set((userIds || []).filter(Boolean))];

        if (!uniqueIds.length) return summaries;

        try {
            const rows = await client<{
                id: string;
                email: string | null;
                raw_user_meta_data: Record<string, any> | null;
            }[]>`
                SELECT id, email, raw_user_meta_data
                FROM auth.users
                WHERE id = ANY(${uniqueIds}::uuid[])
            `;

            for (const row of rows) {
                const meta = row.raw_user_meta_data || {};

                summaries.set(row.id, {
                    name: meta.full_name || meta.name || row.email || 'Team Member',
                    email: row.email || '',
                });
            }
        } catch (error: any) {
            console.error('❌ getUserSummariesByIds failed:', error.message);
            // Unresolved ids are simply absent; callers fall back to whatever
            // sender fields the row already carries.
        }

        return summaries;
    },

    /**
     * @deprecated Use getUsernamesByIds(). Kept as an alias for existing callers.
     */
    async getUsernamesByIdsSql(userIds: string[]): Promise<Map<string, string | null>> {
        return this.getUsernamesByIds(userIds);
    },
};
