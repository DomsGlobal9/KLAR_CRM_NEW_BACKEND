import { supabaseAdmin } from '../config';
import { User } from '@supabase/supabase-js';
import { client } from '../db/drizzle';

/**
 * Shape of an auth.users row as read over the direct Postgres connection.
 */
interface AuthUserRow {
    id: string;
    email: string | null;
    raw_user_meta_data: Record<string, any> | null;
    last_sign_in_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    email_confirmed_at: string | null;
}

/**
 * Map a raw auth.users row into the same shape formatAuthUser() produces, so
 * callers cannot tell whether the user came from the Auth API or from SQL.
 */
const formatAuthUserRow = (row: AuthUserRow) => {
    const meta = row.raw_user_meta_data || {};

    return {
        id: row.id,
        email: row.email ?? undefined,
        username: meta.username,
        role: meta.role ?? 'user',
        status: meta.status ?? 'active',
        full_name: meta.full_name,
        phone: meta.phone,
        profile_image_url: meta.profile_image_url,
        assigned_under: meta.assigned_under,
        department: meta.department,
        notes: meta.notes,
        assigned_leads_count: meta.assigned_leads_count ?? 0,
        created_by: meta.created_by,
        last_login_at: row.last_sign_in_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        email_confirmed_at: row.email_confirmed_at,
    };
};

/**
 * Format Supabase auth user
 */
export const formatAuthUser = (authUser: User) => ({
    id: authUser.id,
    email: authUser.email,
    username: authUser.user_metadata?.username,
    role: authUser.user_metadata?.role ?? 'user',
    status: authUser.user_metadata?.status ?? 'active',
    full_name: authUser.user_metadata?.full_name,
    phone: authUser.user_metadata?.phone,
    profile_image_url: authUser.user_metadata?.profile_image_url,
    assigned_under: authUser.user_metadata?.assigned_under,
    department: authUser.user_metadata?.department,
    notes: authUser.user_metadata?.notes,
    assigned_leads_count: authUser.user_metadata?.assigned_leads_count ?? 0,
    created_by: authUser.user_metadata?.created_by,
    last_login_at: authUser.last_sign_in_at,
    created_at: authUser.created_at,
    updated_at: authUser.updated_at,
    email_confirmed_at: authUser.email_confirmed_at,
});

/**
 * Get user by ID (BEST way)
 */
export const getUserById = async (id: string) => {
    try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);

        if (error || !data?.user) return null;

        return formatAuthUser(data.user);
    } catch (err) {

        return null;
    }
};

/**
 * Get user by email.
 *
 * Previously paginated through the entire Auth user list (1 API call per 1000
 * users, on every signup and password reset). Now a single indexed lookup.
 */
export const getUserByEmail = async (email: string) => {
    try {
        if (!email) return null;

        const rows = await client<AuthUserRow[]>`
            SELECT id, email, raw_user_meta_data,
                   last_sign_in_at, created_at, updated_at, email_confirmed_at
            FROM auth.users
            WHERE lower(email) = lower(${email})
            LIMIT 1
        `;

        return rows.length ? formatAuthUserRow(rows[0]) : null;
    } catch (err: any) {
        console.error('❌ getUserByEmail failed:', err.message);
        return null;
    }
};

/**
 * Get user by username (from user_metadata).
 *
 * Previously paginated through the entire Auth user list. Now a single query
 * against the JSONB metadata. See note below about the supporting index.
 */
export const getUserByUsername = async (username: string) => {
    try {
        if (!username) return null;

        const rows = await client<AuthUserRow[]>`
            SELECT id, email, raw_user_meta_data,
                   last_sign_in_at, created_at, updated_at, email_confirmed_at
            FROM auth.users
            WHERE raw_user_meta_data ->> 'username' = ${username}
            LIMIT 1
        `;

        return rows.length ? formatAuthUserRow(rows[0]) : null;
    } catch (err: any) {
        console.error('❌ getUserByUsername failed:', err.message);
        return null;
    }
};

/**
 * Create audit log
 */
export const createAuditLog = async (logData: Record<string, any>): Promise<void> => {
    try {
        const { error } = await supabaseAdmin
            .from('audit_logs')
            .insert({
                ...logData,
                created_at: new Date().toISOString(),
            });

        if (error) {

        }
    } catch (err) {

    }
};

export const cleanUserMetadata = (metadata: Record<string, any>): Record<string, any> => {

    let cleaned = { ...metadata };
    if (cleaned.user_metadata) {
        cleaned = {
            ...cleaned,
            ...cleaned.user_metadata
        };
    }
    delete cleaned.user_metadata;

    return cleaned;
};