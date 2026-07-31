import { createClient } from '@supabase/supabase-js';
import {
    envConfig,
    validateConfig,
    getCurrentSupabaseServiceRole
} from './env.config';

/**
 * Re-validate config before initializing Supabase
 */
try {
    validateConfig();
} catch (error) {


    process.exit(1);
}

/**
 * Log which environment we're using
 */


/**
 * Initialize Supabase client with environment-specific configuration
 * Using ANON_KEY for regular client operations
 */
export const supabase = createClient(
    envConfig.SUPABASE_URL,
    envConfig.SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        },
        db: {
            schema: 'public'
        },
        global: {
            headers: {
                'x-application-name': 'your-app-name',
                'x-environment': envConfig.NODE_ENV
            }
        }
    }
);

/**
 * Supabase Admin Client (Service Role)
 * ⚠️ Backend-only, bypasses RLS
 * Uses the correct service role key for the current environment
 */
export const supabaseAdmin = createClient(
    envConfig.SUPABASE_URL, 
    getCurrentSupabaseServiceRole(), // Use the helper function from env.config
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        },
        db: {
            schema: 'public'
        },
        global: {
            headers: {
                'x-application-name': 'your-app-name',
                'x-environment': envConfig.NODE_ENV,
                'x-supabase-role': 'service_role'
            }
        }
    }
);

/**
 * Test connection on startup (optional)
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
    try {
        // Try to get a session to test connection
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {

            return false;
        }



        // Also test admin connection
        try {
            const { data: adminData, error: adminError } = await supabaseAdmin.auth.getSession();
            if (adminError) {

            } else {

            }
        } catch (adminTestError) {

        }

        return true;
    } catch (error) {

        return false;
    }
};

/**
 * Helper function to get service role key safely
 */
export const getServiceRoleKey = (): string => {
    return getCurrentSupabaseServiceRole();
};

/**
 * Export environment for conditional logic elsewhere
 */
export const getCurrentEnvironment = () => envConfig.NODE_ENV;

export const getSupabaseConfig = () => ({
    url: envConfig.SUPABASE_URL,
    anonKey: envConfig.SUPABASE_ANON_KEY,
    serviceRoleKey: getCurrentSupabaseServiceRole(),
    environment: envConfig.NODE_ENV
});

/**
 * Test admin client with a safe query
 */
export const testAdminPrivileges = async () => {
    try {
        const { data, error } = await supabaseAdmin        
            .from('users')
            .select('*')
            .limit(1);


        if (error) {


            const { data: authData } = await supabaseAdmin.auth.admin.listUsers();

        } else {

        }
    } catch (error) {

    }
};

/**
 * Optional Part: Run connection tests in development
 */
if (envConfig.NODE_ENV === 'development') {
    setTimeout(() => {
        testSupabaseConnection().then(connected => {
            if (connected) {
                testAdminPrivileges();
            }
        });
    }, 1000);
}