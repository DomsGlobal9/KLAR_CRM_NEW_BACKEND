import { createClient } from '@supabase/supabase-js';
import { envConfig } from './env.config';

// Initialize Supabase client
export const supabase = createClient(envConfig.SUPABASE_URL, envConfig.SUPABASE_ANON_KEY);
