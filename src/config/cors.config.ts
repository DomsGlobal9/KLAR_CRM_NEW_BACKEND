import { CorsOptions } from 'cors';
import { envConfig } from './env.config';

export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        /**
         * Allow wild card entry
         */
        if (envConfig.CORS_ORIGIN.includes('*')) {
            return callback(null, true);
        }

        /**
         * Allow specific origins
         */
        if (origin && envConfig.CORS_ORIGIN.includes(origin)) {
            return callback(null, true);
        }

        /**
         * Production → block
         */
        if (envConfig.NODE_ENV === 'production') {
            console.error(`❌ CORS blocked for origin: ${origin}`);
            return callback(new Error('Not allowed by CORS'));
        }

        // Development → warn but allow
        console.warn(`⚠️ CORS warning: ${origin} not in allowlist`);
        callback(null, true);
    },

    methods: envConfig.CORS_METHODS,
    allowedHeaders: envConfig.CORS_ALLOWED_HEADERS,
    credentials: envConfig.CORS_CREDENTIALS,
    maxAge: envConfig.CORS_MAX_AGE,
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
};
