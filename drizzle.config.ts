import { defineConfig } from 'drizzle-kit';
import { envConfig } from './src/config/env.config';

const isProduction = envConfig.NODE_ENV === "production";
let supabaseUrl = '';

console.log("[DEBUG] Is Production", isProduction);

if (isProduction) {
  supabaseUrl = envConfig.SUPABASE_PRODUCTION_DATABASE_URL
}
else {
  supabaseUrl = envConfig.SUPABASE_DATABASE_URL
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: supabaseUrl,
    ssl: true,
  },
  migrations: {
    table: 'migrations',
    schema: 'public',
  },
  breakpoints: false,
});