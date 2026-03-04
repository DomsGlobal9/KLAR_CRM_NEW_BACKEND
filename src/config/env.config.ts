import dotenv from 'dotenv';

/**
 * Load environment variables
 */
dotenv.config();

interface EnvConfig {
    /**
     * Server
     */
    PORT: number;
    NODE_ENV: 'development' | 'production' | 'test';

    

 TWILIO_ACCOUNT_SID: string;
 TWILIO_AUTH_TOKEN : string;
 TWILIO_VERIFY_SERVICE_SID : string;
 TWILIO_PHONE_NUMBER : number;

    /**
     * SMTP
     */
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_SECURE: boolean;
    SMTP_USER: string;
    SMTP_PASS: string;

    /**
     * Email Defaults
     */
    DEFAULT_FROM_EMAIL: string;
    DEFAULT_FROM_NAME: string;
    DEFAULT_REPLY_TO: string;

    /**
     * CORS
     */
    CORS_ORIGIN: string[];
    CORS_METHODS: string[];
    CORS_ALLOWED_HEADERS: string[];
    CORS_CREDENTIALS: boolean;
    CORS_MAX_AGE: number;

    /**
     * Supabase - All environments
     */
    SUPABASE_PRODUCTION_URL: string;
    SUPABASE_PRODUCTION_ANON_KEY: string;
    SUPABASE_PRODUCTION_SERVICE_ROLE: string;

    SUPABASE_TESTING_URL: string;
    SUPABASE_TESTING_ANON_KEY: string;
    SUPABASE_TESTING_SERVICE_ROLE: string;

    SUPABASE_DEVELOPMENT_URL: string;
    SUPABASE_DEVELOPMENT_ANON_KEY: string;
    SUPABASE_DEVELOPMENT_SERVICE_ROLE: string;

    /**
     * Active environment Supabase config
     */
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE: string;
}

/**
 * Parse comma-separated strings into arrays
 * @param value 
 * @param defaultValue 
 * @returns 
 */
const parseArray = (value: string | undefined, defaultValue: string[]): string[] => {
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim());
};

/**
 * Parse boolean values
 */
const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
};

/**
 * Parse number values
 * @param value 
 * @param defaultValue 
 * @returns 
 */
const parseNumber = (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse and validate NODE_ENV
 * @param value 
 * @returns 
 */
const parseNodeEnv = (value: string | undefined): 'development' | 'production' | 'test' => {
    if (!value) return 'development';

    const env = value.toLowerCase().trim();
    if (env === 'development' || env === 'production' || env === 'test') {
        return env;
    }

    throw new Error(`Invalid NODE_ENV: ${value}. Must be 'development', 'production', or 'test'`);
};

/**
 * Validate individual required field
 * @param value 
 * @param fieldName 
 * @returns 
 */
const validateRequired = (value: string | undefined, fieldName: string): string => {
    if (!value || value.trim() === '') {
        throw new Error(`Missing required environment variable: ${fieldName}`);
    }
    return value.trim();
};

/**
 * Validate required fields with custom error messages
 */
const validateRequiredFields = (): void => {

    /**
     * SMTP validation
     */
    validateRequired(process.env.SMTP_HOST, 'SMTP_HOST');
    validateRequired(process.env.SMTP_USER, 'SMTP_USER');
    validateRequired(process.env.SMTP_PASS, 'SMTP_PASS');

    /**
     * Supabase production validation (required for all environments)
     */
    validateRequired(process.env.SUPABASE_PRODUCTION_URL, 'SUPABASE_PRODUCTION_URL');
    validateRequired(process.env.SUPABASE_PRODUCTION_ANON_KEY, 'SUPABASE_PRODUCTION_ANON_KEY');
    validateRequired(process.env.SUPABASE_PRODUCTION_SERVICE_ROLE, 'SUPABASE_PRODUCTION_SERVICE_ROLE');

    /**
     * Supabase testing validation (required for test environment)
     */
    const nodeEnv = parseNodeEnv(process.env.NODE_ENV);

    if (nodeEnv === 'test') {
        validateRequired(process.env.SUPABASE_TESTING_URL, 'SUPABASE_TESTING_URL');
        validateRequired(process.env.SUPABASE_TESTING_ANON_KEY, 'SUPABASE_TESTING_ANON_KEY');
        validateRequired(process.env.SUPABASE_TESTING_SERVICE_ROLE, 'SUPABASE_TESTING_SERVICE_ROLE');
    }

    /**
     * Supabase development validation (required for development environment)
     */
    if (nodeEnv === 'development') {
        validateRequired(process.env.SUPABASE_DEVELOPMENT_URL, 'SUPABASE_DEVELOPMENT_URL');
        validateRequired(process.env.SUPABASE_DEVELOPMENT_ANON_KEY, 'SUPABASE_DEVELOPMENT_ANON_KEY');
        validateRequired(process.env.SUPABASE_DEVELOPMENT_SERVICE_ROLE, 'SUPABASE_DEVELOPMENT_SERVICE_ROLE');
    }
};

/**
 * Execute validation before creating config
 */
validateRequiredFields();

/**
 * Determine which Supabase URL and key to use based on NODE_ENV
 */
const nodeEnv = parseNodeEnv(process.env.NODE_ENV);

const getSupabaseUrl = (): string => {
    switch (nodeEnv) {
        case 'production':
            return validateRequired(process.env.SUPABASE_PRODUCTION_URL, 'SUPABASE_PRODUCTION_URL');
        case 'test':
            return validateRequired(process.env.SUPABASE_TESTING_URL, 'SUPABASE_TESTING_URL');
        case 'development':
            return validateRequired(process.env.SUPABASE_DEVELOPMENT_URL, 'SUPABASE_DEVELOPMENT_URL');
        default:
            return validateRequired(process.env.SUPABASE_DEVELOPMENT_URL, 'SUPABASE_DEVELOPMENT_URL');
    }
};

const getSupabaseAnonKey = (): string => {
    switch (nodeEnv) {
        case 'production':
            return validateRequired(process.env.SUPABASE_PRODUCTION_ANON_KEY, 'SUPABASE_PRODUCTION_ANON_KEY');
        case 'test':
            return validateRequired(process.env.SUPABASE_TESTING_ANON_KEY, 'SUPABASE_TESTING_ANON_KEY');
        case 'development':
            return validateRequired(process.env.SUPABASE_DEVELOPMENT_ANON_KEY, 'SUPABASE_DEVELOPMENT_ANON_KEY');
        default:
            return validateRequired(process.env.SUPABASE_DEVELOPMENT_ANON_KEY, 'SUPABASE_DEVELOPMENT_ANON_KEY');
    }
};

const getSupabaseServiceRole = (): string => {
    switch (nodeEnv) {
        case 'production':
            return validateRequired(process.env.SUPABASE_PRODUCTION_SERVICE_ROLE, 'SUPABASE_PRODUCTION_SERVICE_ROLE');
        case 'test':
            return validateRequired(process.env.SUPABASE_TESTING_SERVICE_ROLE, 'SUPABASE_TESTING_SERVICE_ROLE');
        case 'development':
            return validateRequired(process.env.SUPABASE_DEVELOPMENT_SERVICE_ROLE, 'SUPABASE_DEVELOPMENT_SERVICE_ROLE');
        default:
            return validateRequired(process.env.SUPABASE_DEVELOPMENT_SERVICE_ROLE, 'SUPABASE_DEVELOPMENT_SERVICE_ROLE');
    }
};

/**
 * Validate and export environment configuration
 */
export const envConfig: EnvConfig = {

    /**
     * Server
     */
    PORT: parseNumber(process.env.PORT, 3000),
    NODE_ENV: nodeEnv,

    TWILIO_ACCOUNT_SID: validateRequired(process.env.TWILIO_ACCOUNT_SID, 'TWILIO_ACCOUNT_SID'),
    TWILIO_AUTH_TOKEN: validateRequired(process.env.TWILIO_AUTH_TOKEN, 'TWILIO_AUTH_TOKEN'),
    TWILIO_VERIFY_SERVICE_SID: validateRequired(process.env.TWILIO_VERIFY_SERVICE_SID, 'TWILIO_VERIFY_SERVICE_SID'),
    TWILIO_PHONE_NUMBER: parseNumber(process.env.TWILIO_PHONE_NUMBER, 0),

    /**
     * SMTP
     */
    SMTP_HOST: validateRequired(process.env.SMTP_HOST, 'SMTP_HOST'),
    SMTP_PORT: parseNumber(process.env.SMTP_PORT, 587),
    SMTP_SECURE: parseBoolean(process.env.SMTP_SECURE, false),
    SMTP_USER: validateRequired(process.env.SMTP_USER, 'SMTP_USER'),
    SMTP_PASS: validateRequired(process.env.SMTP_PASS, 'SMTP_PASS'),

    /**
     * Email Defaults
     */
    DEFAULT_FROM_EMAIL: validateRequired(process.env.DEFAULT_FROM_EMAIL, 'DEFAULT_FROM_EMAIL') || 'noreply@example.com',
    DEFAULT_FROM_NAME: validateRequired(process.env.DEFAULT_FROM_NAME, 'DEFAULT_FROM_NAME') || 'Your App',
    DEFAULT_REPLY_TO: validateRequired(process.env.DEFAULT_REPLY_TO, 'DEFAULT_REPLY_TO') ||
        process.env.DEFAULT_FROM_EMAIL ||
        'noreply@example.com',

    /**
     * CORS
     */
    CORS_ORIGIN: parseArray(process.env.CORS_ORIGIN, ['http://localhost:3000']),
    CORS_METHODS: parseArray(process.env.CORS_METHODS, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    CORS_ALLOWED_HEADERS: parseArray(process.env.CORS_ALLOWED_HEADERS, ['Content-Type', 'Authorization']),
    CORS_CREDENTIALS: parseBoolean(process.env.CORS_CREDENTIALS, true),
    CORS_MAX_AGE: parseNumber(process.env.CORS_MAX_AGE, 86400),

    /**
     * Supabase - All environment configurations
     */
    SUPABASE_PRODUCTION_URL: validateRequired(process.env.SUPABASE_PRODUCTION_URL, 'SUPABASE_PRODUCTION_URL'),
    SUPABASE_PRODUCTION_ANON_KEY: validateRequired(process.env.SUPABASE_PRODUCTION_ANON_KEY, 'SUPABASE_PRODUCTION_ANON_KEY'),
    SUPABASE_PRODUCTION_SERVICE_ROLE: validateRequired(process.env.SUPABASE_PRODUCTION_SERVICE_ROLE, 'SUPABASE_PRODUCTION_SERVICE_ROLE'),

    SUPABASE_TESTING_URL: process.env.SUPABASE_TESTING_URL || '',
    SUPABASE_TESTING_ANON_KEY: process.env.SUPABASE_TESTING_ANON_KEY || '',
    SUPABASE_TESTING_SERVICE_ROLE: process.env.SUPABASE_TESTING_SERVICE_ROLE || '',

    SUPABASE_DEVELOPMENT_URL: process.env.SUPABASE_DEVELOPMENT_URL || '',
    SUPABASE_DEVELOPMENT_ANON_KEY: process.env.SUPABASE_DEVELOPMENT_ANON_KEY || '',
    SUPABASE_DEVELOPMENT_SERVICE_ROLE: process.env.SUPABASE_DEVELOPMENT_SERVICE_ROLE || '',

    /**
     * Active Supabase config based on NODE_ENV
     */
    SUPABASE_URL: getSupabaseUrl(),
    SUPABASE_ANON_KEY: getSupabaseAnonKey(),
    SUPABASE_SERVICE_ROLE: getSupabaseServiceRole(),
};

/**
 * Additional validation function for the entire config
 */
export const validateConfig = (): void => {
    const config = envConfig;

    /**
     * Check all values are present (not empty strings for required fields)
     */
    const requiredStringFields = [
        'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS',
        'DEFAULT_FROM_EMAIL', 'DEFAULT_FROM_NAME',
        'SUPABASE_URL', 'SUPABASE_ANON_KEY'
    ];

    const missingValues: string[] = [];

    for (const field of requiredStringFields) {
        const value = config[field as keyof EnvConfig];
        if (typeof value === 'string' && value.trim() === '') {
            missingValues.push(field);
        }
    }

    if (missingValues.length > 0) {
        throw new Error(`Configuration has empty values for required fields: ${missingValues.join(', ')}`);
    }

    /**
     * Validate email format
     */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.DEFAULT_FROM_EMAIL)) {
        throw new Error(`Invalid email format for DEFAULT_FROM_EMAIL: ${config.DEFAULT_FROM_EMAIL}`);
    }

    if (config.DEFAULT_REPLY_TO && !emailRegex.test(config.DEFAULT_REPLY_TO)) {
        throw new Error(`Invalid email format for DEFAULT_REPLY_TO: ${config.DEFAULT_REPLY_TO}`);
    }

    /**
     * Validate Supabase URLs format
     */
    const supabaseUrlRegex = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/;
    if (!supabaseUrlRegex.test(config.SUPABASE_URL)) {
        console.warn(`⚠️  SUPABASE_URL may not be in correct format: ${config.SUPABASE_URL}`);
        console.warn('Expected format: https://[project-id].supabase.co');
    }

    /**
     * Validate Supabase keys format (JWT tokens)
     */
    const supabaseKeyRegex = /^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\..+/;
    if (!supabaseKeyRegex.test(config.SUPABASE_ANON_KEY)) {
        console.warn(`⚠️  SUPABASE_ANON_KEY may not be in correct format. Expected JWT token starting with 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'`);
    }
};

/**
 * Run validation on import
 */
validateConfig();

/**
 * Helper function to get service role key for the current environment
 */
export const getCurrentSupabaseServiceRole = (): string => {
    return getSupabaseServiceRole();
};

/**
 * Helper function to log current environment info
 */
export const logEnvironmentInfo = (): void => {
    console.log(`🚀 Environment: ${envConfig.NODE_ENV}`);
    // console.log(`🔗 Supabase URL: ${envConfig.SUPABASE_URL.substring(0, 30)}...`);
    // console.log(`🔑 Supabase Key: ${envConfig.SUPABASE_ANON_KEY.substring(0, 20)}...`);
    console.log(`🌐 CORS Origin: ${envConfig.CORS_ORIGIN.join(', ')}`);
};

/**
 * Helper function to check if in production
 */
export const isProduction = (): boolean => {
    return envConfig.NODE_ENV === 'production';
};

/**
 * Helper function to check if in development
 */
export const isDevelopment = (): boolean => {
    return envConfig.NODE_ENV === 'development';
};

/**
 * Helper function to check if in test
 */
export const isTest = (): boolean => {
    return envConfig.NODE_ENV === 'test';
};

/**
 * Auto-log environment info on import
 */
if (isDevelopment()) {
    logEnvironmentInfo();
}