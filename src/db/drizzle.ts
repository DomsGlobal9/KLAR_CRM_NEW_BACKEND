import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { envConfig } from '../config/env.config';

const connectionString = envConfig.SUPABASE_DATABASE_URL;

if (!connectionString) {
  throw new Error('SUPABASE_DATABASE_URL is not defined in environment variables');
}


const client = postgres(connectionString, { 
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export { client };