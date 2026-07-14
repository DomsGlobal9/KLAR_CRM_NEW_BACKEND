import { defineConfig } from 'drizzle-kit';
import { envConfig } from './src/config/env.config';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: envConfig.SUPABASE_DATABASE_URL,
    ssl: true,
  },
  migrations: {
    table: 'migrations',
    schema: 'public',
  },
  breakpoints: false,
});