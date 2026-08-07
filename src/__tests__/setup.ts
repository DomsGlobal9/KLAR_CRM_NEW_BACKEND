/**
 * Test setup.
 *
 * env.config.ts validates required environment variables at import time and
 * throws if any are missing, so every value it demands must exist before the
 * first import runs. These are dummy values — no test may contact a real
 * service. Anything that would perform I/O is mocked in the test file itself.
 */

const testEnv: Record<string, string> = {
    NODE_ENV: 'test',
    PORT: '3001',

    SMTP_HOST: 'smtp.test.invalid',
    SMTP_PORT: '587',
    SMTP_USER: 'test@test.invalid',
    SMTP_PASS: 'test-password',

    IMAP_HOST: 'imap.test.invalid',
    IMAP_PORT: '993',
    IMAP_USER: 'test@test.invalid',
    IMAP_PASS: 'test-password',

    DEFAULT_FROM_EMAIL: 'noreply@test.invalid',
    DEFAULT_FROM_NAME: 'Test',
    DEFAULT_REPLY_TO: 'noreply@test.invalid',

    SUPABASE_PRODUCTION_URL: 'https://test-project.supabase.co',
    SUPABASE_PRODUCTION_ANON_KEY: 'test-anon-key',
    SUPABASE_PRODUCTION_SERVICE_ROLE: 'test-service-role',

    SUPABASE_TESTING_URL: 'https://test-project.supabase.co',
    SUPABASE_TESTING_ANON_KEY: 'test-anon-key',
    SUPABASE_TESTING_SERVICE_ROLE: 'test-service-role',

    SUPABASE_DATABASE_URL: 'postgres://test:test@localhost:5432/test',

    SUPER_ADMIN_EMAIL: 'admin@test.invalid',

    /**
     * Rate limits are read at module-import time, so they must be set before
     * the middleware loads. Deliberately tiny so tests can reach the threshold
     * in a few requests instead of hundreds.
     */
    RATE_LIMIT_WINDOW_MS: '60000',
    RATE_LIMIT_MAX: '5',
    AUTH_RATE_LIMIT_WINDOW_MS: '60000',
    AUTH_RATE_LIMIT_MAX: '3',
};

for (const [key, value] of Object.entries(testEnv)) {
    // Never clobber a value the developer set deliberately.
    if (!process.env[key]) process.env[key] = value;
}
