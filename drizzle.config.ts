import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

export default defineConfig({
  out: './src/db/drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    url: databaseUrl,
  },
  breakpoints: true,
});