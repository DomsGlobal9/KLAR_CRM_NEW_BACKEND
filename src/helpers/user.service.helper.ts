import { supabaseAdmin } from '../config';
import { User } from '@supabase/supabase-js';

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
        console.error('getUserById failed:', err);
        return null;
    }
};

/**
 * Get user by email
 * ⚠️ Supabase does NOT provide direct lookup → must paginate
 */
export const getUserByEmail = async (email: string) => {
    try {
        let page = 1;
        const perPage = 1000;

        while (true) {
            const { data, error } =
                await supabaseAdmin.auth.admin.listUsers({ page, perPage });

            if (error) return null;

            const user = data.users.find(u => u.email === email);
            if (user) return formatAuthUser(user);

            if (data.users.length < perPage) break;
            page++;
        }

        return null;
    } catch (err) {
        console.error('getUserByEmail failed:', err);
        return null;
    }
};

/**
 * Get user by username (from user_metadata)
 */
export const getUserByUsername = async (username: string) => {
    try {
        let page = 1;
        const perPage = 1000;

        while (true) {
            const { data, error } =
                await supabaseAdmin.auth.admin.listUsers({ page, perPage });

            if (error) return null;

            const user = data.users.find(
                u => u.user_metadata?.username === username
            );

            if (user) return formatAuthUser(user);

            if (data.users.length < perPage) break;
            page++;
        }

        return null;
    } catch (err) {
        console.error('getUserByUsername failed:', err);
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
            console.error('Failed to create audit log:', error.message);
        }
    } catch (err) {
        console.error('Audit log error:', err);
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