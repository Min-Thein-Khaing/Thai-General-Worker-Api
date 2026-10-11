import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from './index.js';

async function reset() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set.');
  }

  const allowDestructive =
    process.env.ALLOW_DESTRUCTIVE_SEED === 'true' ||
    process.argv.includes('--force');

  if (!allowDestructive) {
    const parsedUrl = new URL(databaseUrl);
    const databaseHost = parsedUrl.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (!['localhost', '127.0.0.1', '::1'].includes(databaseHost)) {
      throw new Error(
        `Refusing to clear non-local database host "${databaseHost}". ` +
        `Run "npm run db:reset:prod" to reset a production database.`,
      );
    }
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    await db.transaction(async (tx) => {
      await tx.delete(schema.document);
      await tx.delete(schema.worker);
      await tx.delete(schema.manager);
      await tx.delete(schema.year);
      await tx.delete(schema.company);
      await tx.delete(schema.user);
    });

    console.log('✅ Database cleared successfully. All tables are now empty.');
  } finally {
    await client.end();
  }
}

reset().catch((error: unknown) => {
  console.error('Database reset failed:', error);
  process.exitCode = 1;
});
