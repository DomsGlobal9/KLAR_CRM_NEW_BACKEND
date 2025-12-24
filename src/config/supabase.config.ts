import { createClient } from '@supabase/supabase-js';
import { envConfig, validateConfig } from './env.config';

/**
 * Re-validate config before initializing Supabase
 */
try {
    validateConfig();
} catch (error) {
    console.error('❌ Configuration validation failed:');
    console.error(error);
    process.exit(1);
}

/**
 * Log which environment we're using
 */
console.log(`🚀 Initializing Supabase client for ${envConfig.NODE_ENV} environment`);

/**
 * Initialize Supabase client with environment-specific configuration
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
 * Test connection on startup (optional)
 * @returns 
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
    try {
        const { data, error } = await supabase.from('_test_connection').select('count').limit(1);

        if (error) {
            /**
             * Try a different approach - check if we can query a system table
             */
            const { error: authError } = await supabase.auth.getSession();

            if (authError) {
                console.error(`❌ Supabase connection test failed for ${envConfig.NODE_ENV}:`, authError.message);
                return false;
            }
        }

        console.log(`✅ Successfully connected to Supabase (${envConfig.NODE_ENV})`);
        return true;
    } catch (error) {
        console.error(`❌ Supabase connection test failed for ${envConfig.NODE_ENV}:`, error);
        return false;
    }
};

/**
 * Export environment for conditional logic elsewhere
 * @returns 
 */
export const getCurrentEnvironment = () => envConfig.NODE_ENV;
export const getSupabaseConfig = () => ({
    url: envConfig.SUPABASE_URL,
    key: envConfig.SUPABASE_ANON_KEY,
    environment: envConfig.NODE_ENV
});