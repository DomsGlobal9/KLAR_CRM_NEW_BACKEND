/**
 * Deployment pre-check for v1.1.0.
 *
 * The batched username lookup added in v1.1.0 reads auth.users directly over
 * SUPABASE_DATABASE_URL. If the connecting role cannot see that table the
 * lookup degrades silently — usernames render blank instead of erroring — so
 * this must be confirmed before deploying to a new environment.
 *
 *   npm run verify:auth-access
 *
 * Read-only. Touches nothing.
 */
import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const url = process.env.SUPABASE_DATABASE_URL;

if (!url) {
    console.error('FAIL - SUPABASE_DATABASE_URL is not set');
    process.exit(1);
}

const client = postgres(url, { prepare: false, max: 1, connect_timeout: 10 });

(async () => {
    try {
        const rows = await client<{ id: string; raw_user_meta_data: any }[]>`
            SELECT id, raw_user_meta_data
            FROM auth.users
            LIMIT 5
        `;

        console.log(`OK   - auth.users is readable (${rows.length} sample rows)`);

        const named = rows.filter(
            r => r.raw_user_meta_data?.username || r.raw_user_meta_data?.full_name
        ).length;

        console.log(`     - ${named}/${rows.length} sample rows carry username or full_name`);

        if (rows.length > 0 && named === 0) {
            console.warn('WARN - no usernames found; confirm the metadata key names');
        }
    } catch (err: any) {
        console.error('FAIL - cannot read auth.users:', err.message);
        console.error('       Grant the role USAGE on schema auth and SELECT on auth.users,');
        console.error('       or revert username lookups to the Auth API.');
        process.exitCode = 1;
    } finally {
        await client.end();
    }
})();
