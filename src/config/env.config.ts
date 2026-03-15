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

    /**
     * OTP Configuration
     */
    OTP: {
        LENGTH: number;
        EXPIRY_MINUTES: number;
        BYPASS_IN_DEV: boolean;
        USE_NUMERIC_ONLY: boolean;
        MAX_RESEND_ATTEMPTS: number;
        DEV_STATIC_CODE: string;
        RESEND_WINDOW_MINUTES: number;
        RESEND_COOLDOWN_SECONDS: number;
        MAX_VERIFICATION_ATTEMPTS: number;
    };

    /**
     * Whatsapp Number
     */
    WHATSAPP_NUMBER: string;

    /**
     * Itinerary stage id
     */
    ITIENARY_STAGE: string;
    QUOTE_STAGE: string;
    S3_SERVER_URL: string;
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
 * Validate optional field with default
 */
const validateOptional = (value: string | undefined, defaultValue: string): string => {
    if (!value || value.trim() === '') {
        return defaultValue;
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

    /**
     * OTP validation - only validate DEV_STATIC_CODE in development
     */
    if (nodeEnv === 'development') {
        if (!process.env.OTP_DEV_STATIC_CODE) {
            console.warn('⚠️  OTP_DEV_STATIC_CODE not set. Using default "123456" for development.');
        }
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

    /**
     * OTP Configuration
     */
    OTP: {
        LENGTH: parseNumber(process.env.OTP_LENGTH, 6),
        EXPIRY_MINUTES: parseNumber(process.env.OTP_EXPIRY_MINUTES, 10),
        BYPASS_IN_DEV: parseBoolean(process.env.OTP_BYPASS_IN_DEV, true),
        USE_NUMERIC_ONLY: parseBoolean(process.env.OTP_USE_NUMERIC_ONLY, true),
        MAX_RESEND_ATTEMPTS: parseNumber(process.env.OTP_MAX_RESEND_ATTEMPTS, 3),
        DEV_STATIC_CODE: validateOptional(process.env.OTP_DEV_STATIC_CODE, '123456'),
        RESEND_WINDOW_MINUTES: parseNumber(process.env.OTP_RESEND_WINDOW_MINUTES, 30),
        RESEND_COOLDOWN_SECONDS: parseNumber(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
        MAX_VERIFICATION_ATTEMPTS: parseNumber(process.env.OTP_MAX_VERIFICATION_ATTEMPTS, 5),
    },

    /**
    * Whatsapp Number
    */
    WHATSAPP_NUMBER: validateOptional(process.env.WHATSAPP_NUMBER, ''),

    /**
     * Itinerary stage id
     */
    ITIENARY_STAGE: process.env.ITINERARY_STAGE_ID || '',
    QUOTE_STAGE: process.env.QUOTE_STAGE_ID || '',
    S3_SERVER_URL: process.env.S3_SERVER || '',
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

    /**
     * Validate OTP configuration
     */
    if (config.OTP.LENGTH < 4 || config.OTP.LENGTH > 8) {
        console.warn(`⚠️  OTP_LENGTH is ${config.OTP.LENGTH}. Recommended length is between 4 and 8 characters.`);
    }

    if (config.OTP.EXPIRY_MINUTES < 1 || config.OTP.EXPIRY_MINUTES > 30) {
        console.warn(`⚠️  OTP_EXPIRY_MINUTES is ${config.OTP.EXPIRY_MINUTES}. Recommended expiry is between 1 and 30 minutes.`);
    }

    if (config.OTP.RESEND_COOLDOWN_SECONDS < 30) {
        console.warn(`⚠️  OTP_RESEND_COOLDOWN_SECONDS is ${config.OTP.RESEND_COOLDOWN_SECONDS}. Values less than 30 seconds may lead to spam.`);
    }

    if (config.OTP.MAX_RESEND_ATTEMPTS > 5) {
        console.warn(`⚠️  OTP_MAX_RESEND_ATTEMPTS is ${config.OTP.MAX_RESEND_ATTEMPTS}. High values may lead to abuse.`);
    }

    if (config.NODE_ENV === 'production' && config.OTP.BYPASS_IN_DEV) {
        console.warn(`⚠️  OTP_BYPASS_IN_DEV is true in production. This setting only affects development environment.`);
    }

    if (config.NODE_ENV === 'production' && config.OTP.DEV_STATIC_CODE) {
        console.warn(`⚠️  OTP_DEV_STATIC_CODE is set in production. This is only meant for development.`);
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
    console.log(`🌐 CORS Origin: ${envConfig.CORS_ORIGIN.join(', ')}`);

    console.log(`🔐 OTP Config: Length=${envConfig.OTP.LENGTH}, Expiry=${envConfig.OTP.EXPIRY_MINUTES}min, Cooldown=${envConfig.OTP.RESEND_COOLDOWN_SECONDS}s`);

    if (isDevelopment()) {
        console.log(`🧪 Dev OTP Static Code: ${envConfig.OTP.DEV_STATIC_CODE}`);
        console.log(`🧪 Dev OTP Bypass: ${envConfig.OTP.BYPASS_IN_DEV ? 'Enabled' : 'Disabled'}`);
    }
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