import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface EnvConfig {
    // Server
    PORT: number;
    NODE_ENV: 'development' | 'production' | 'test';

    // SMTP
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_SECURE: boolean;
    SMTP_USER: string;
    SMTP_PASS: string;

    // Email Defaults
    DEFAULT_FROM_EMAIL: string;
    DEFAULT_FROM_NAME: string;
    DEFAULT_REPLY_TO: string;

    // CORS
    CORS_ORIGIN: string[];
    CORS_METHODS: string[];
    CORS_ALLOWED_HEADERS: string[];
    CORS_CREDENTIALS: boolean;
    CORS_MAX_AGE: number;

    // Supabase
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
}

// Parse comma-separated strings into arrays
const parseArray = (value: string | undefined, defaultValue: string[]): string[] => {
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim());
};

// Parse boolean values
const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
};

// Parse number values
const parseNumber = (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};

// Validate and export environment configuration
export const envConfig: EnvConfig = {
    // Server
    PORT: parseNumber(process.env.PORT, 3000),
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',

    // SMTP
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseNumber(process.env.SMTP_PORT, 587),
    SMTP_SECURE: parseBoolean(process.env.SMTP_SECURE, false),
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',

    // Email Defaults
    DEFAULT_FROM_EMAIL: process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
    DEFAULT_FROM_NAME: process.env.DEFAULT_FROM_NAME || 'Your App',
    DEFAULT_REPLY_TO: process.env.DEFAULT_REPLY_TO || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',

    // CORS
    CORS_ORIGIN: parseArray(process.env.CORS_ORIGIN, ['http://localhost:3000']),
    CORS_METHODS: parseArray(process.env.CORS_METHODS, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    CORS_ALLOWED_HEADERS: parseArray(process.env.CORS_ALLOWED_HEADERS, ['Content-Type', 'Authorization']),
    CORS_CREDENTIALS: parseBoolean(process.env.CORS_CREDENTIALS, true),
    CORS_MAX_AGE: parseNumber(process.env.CORS_MAX_AGE, 86400),

    // Supabase
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
};

// Validation
export const validateEnv = (): void => {
    const requiredFields = [
        'SMTP_HOST',
        'SMTP_USER',
        'SMTP_PASS',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
    ];

    const missingFields = requiredFields.filter(field => !process.env[field]);

    if (missingFields.length > 0) {
        throw new Error(`Missing required environment variables: ${missingFields.join(', ')}`);
    }

    if (envConfig.NODE_ENV !== 'development' && envConfig.NODE_ENV !== 'production' && envConfig.NODE_ENV !== 'test') {
        throw new Error(`Invalid NODE_ENV: ${envConfig.NODE_ENV}. Must be 'development', 'production', or 'test'`);
    }
};