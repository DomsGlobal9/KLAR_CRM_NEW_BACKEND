import dotenv from 'dotenv';
import path from 'path';

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

    // CORS
    CORS_ORIGIN: string[];
    CORS_METHODS: string[];
    CORS_ALLOWED_HEADERS: string[];
    CORS_CREDENTIALS: boolean;
    CORS_MAX_AGE: number;

    /**
     * Supabase
     */
    SUPABASE_PRODUCTION_URL: string;
    SUPABASE_PRODUCTION_ANON_KEY: string;
    SUPABASE_TESTING_URL: string;
    SUPABASE_TESTING_ANON_KEY: string;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
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

    /**
     * Supabase testing validation (required for development/test)
     */
    const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
    if (nodeEnv === 'development' || nodeEnv === 'test') {
        validateRequired(process.env.SUPABASE_TESTING_URL, 'SUPABASE_TESTING_URL');
        validateRequired(process.env.SUPABASE_TESTING_ANON_KEY, 'SUPABASE_TESTING_ANON_KEY');
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
    if (nodeEnv === 'production') {
        return validateRequired(process.env.SUPABASE_PRODUCTION_URL, 'SUPABASE_PRODUCTION_URL');
    } else {
        return validateRequired(process.env.SUPABASE_TESTING_URL, 'SUPABASE_TESTING_URL');
    }
};

const getSupabaseAnonKey = (): string => {
    if (nodeEnv === 'production') {
        return validateRequired(process.env.SUPABASE_PRODUCTION_ANON_KEY, 'SUPABASE_PRODUCTION_ANON_KEY');
    } else {
        return validateRequired(process.env.SUPABASE_TESTING_ANON_KEY, 'SUPABASE_TESTING_ANON_KEY');
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
     * Supabase - Always include both sets
     */
    SUPABASE_PRODUCTION_URL: validateRequired(process.env.SUPABASE_PRODUCTION_URL, 'SUPABASE_PRODUCTION_URL'),
    SUPABASE_PRODUCTION_ANON_KEY: validateRequired(process.env.SUPABASE_PRODUCTION_ANON_KEY, 'SUPABASE_PRODUCTION_ANON_KEY'),
    SUPABASE_TESTING_URL: process.env.SUPABASE_TESTING_URL || '',
    SUPABASE_TESTING_ANON_KEY: process.env.SUPABASE_TESTING_ANON_KEY || '',

    /**
     * Dynamic Supabase config based on NODE_ENV
     */
    SUPABASE_URL: getSupabaseUrl(),
    SUPABASE_ANON_KEY: getSupabaseAnonKey(),
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

    console.log(`✓ Environment configuration loaded successfully for ${config.NODE_ENV} environment`);
    console.log(`✓ Using Supabase URL: ${config.SUPABASE_URL.substring(0, 30)}...`);
};

/**
 * Run validation on import
 */
validateConfig();