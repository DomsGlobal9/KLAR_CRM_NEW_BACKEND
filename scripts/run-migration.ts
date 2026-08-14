import * as dotenv from 'dotenv';
dotenv.config();

import { client } from '../src/db/drizzle';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('[AWS RDS] Applying migrations directly to public schema...');
  try {
    const migrationsFolder = path.join(__dirname, '..', 'src', 'db', 'drizzle');
    const journalPath = path.join(migrationsFolder, 'meta', '_journal.json');
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));

    for (const entry of journal.entries) {
      const sqlFilePath = path.join(migrationsFolder, `${entry.tag}.sql`);
      if (!fs.existsSync(sqlFilePath)) continue;
      
      console.log(`[AWS RDS] Executing migration step: ${entry.tag}.sql`);
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Split by statement breakpoint if present
      const statements = sqlContent
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(Boolean);

      for (const statement of statements) {
        try {
          await client.unsafe(statement);
        } catch (err: any) {
          // Ignore duplicate object or table errors if re-running
          if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
            console.warn(`[AWS RDS] Notice on statement: ${err.message}`);
          }
        }
      }
    }

    console.log('[AWS RDS] ✅ All migrations executed!');

    // Read schema info for users table
    const columns = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    console.log('[AWS RDS] Columns in public.users table:');
    console.table(columns);

    const count = await client`SELECT COUNT(*) FROM public.users;`;
    console.log('[AWS RDS] Total rows in public.users:', count[0].count);

  } catch (err: any) {
    console.error('[AWS RDS] ❌ Execution error:', err?.message || err);
  } finally {
    await client.end();
  }
}

main();
