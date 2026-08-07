import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        // Populates dummy env vars before any module is imported. env.config.ts
        // validates required variables at import time and throws without them.
        //
        // Tests live in tests/ rather than src/__tests__/ because .gitignore
        // excludes the latter — see docs/remediation/P06.
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        // These are unit tests over pure logic — they must never touch a real
        // database, Supabase project, or mail server.
        testTimeout: 10_000,
    },
});
