import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from './index.js';

// ─── Default accounts (prisma db reset ပုံစံ) ──────────────────────────────
// ဒီ accounts တွေက always ရှိနေမယ် — testing အတွက် default data
const DEFAULT_ACCOUNTS = [
  {
    fullName: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'ADMIN' as const,
  },
  {
    fullName: 'Manager User',
    email: 'manager@example.com',
    password: 'Manager123!',
    role: 'MANAGER' as const,
  },
  {
    fullName: 'Worker User',
    email: 'worker@example.com',
    password: 'Worker123!',
    role: 'GENERAL_WORKER' as const,
  },
] as const;

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set.');
  }

  const allowDestructive =
    process.env.ALLOW_DESTRUCTIVE_SEED === 'true' ||
    process.argv.includes('--force');

  if (!allowDestructive) {
    const parsedUrl = new URL(databaseUrl);
    const databaseHost = parsedUrl.hostname
      .replace(/^\[|\]$/g, '')
      .toLowerCase();
    if (!['localhost', '127.0.0.1', '::1'].includes(databaseHost)) {
      throw new Error(
        `Refusing to clear non-local database host "${databaseHost}". ` +
          `Run "npm run db:seed:prod" to reset a production database.`,
      );
    }
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    console.log('⏳ Hashing passwords...');
    const accounts = await Promise.all(
      DEFAULT_ACCOUNTS.map(async (account) => ({
        id: randomUUID(),
        fullName: account.fullName,
        email: account.email,
        password: await bcrypt.hash(account.password, 10),
        role: account.role,
        isArchived: false,
      })),
    );

    const [admin, manager, workerUser] = accounts;

    const companyId = randomUUID();
    const yearId = randomUUID();
    const managerId = randomUUID();
    const workerId = randomUUID();

    console.log('🗑️  Wiping all tables (TRUNCATE CASCADE)...');
    await db.transaction(async (tx) => {
      // TRUNCATE CASCADE — prisma db reset ပုံစံ (ပိုမြန်, FK cascade)
      await tx.execute(
        `TRUNCATE TABLE
           "document",
           "worker",
           "manager",
           "year",
           "company",
           "user"
         CASCADE`,
      );

      console.log('🌱 Inserting default accounts...');

      await tx.insert(schema.user).values(accounts);

      await tx.insert(schema.company).values({
        id: companyId,
        userId: admin.id,
        companyName: 'Default Test Company',
        address: 'Test address',
      });

      await tx.insert(schema.year).values({
        id: yearId,
        userId: admin.id,
        startYear: '2026-01-01',
        endYear: '2026-12-31',
      });

      await tx.insert(schema.manager).values({
        id: managerId,
        userId: manager.id,
        companyId,
        gender: 'MALE',
      });

      await tx.insert(schema.worker).values({
        id: workerId,
        userId: workerUser.id,
        managerId,
        yearId,
        companyId,
        gender: 'MALE',
      });
    });

    console.log('\n✅ Database reset complete!\n');
    console.log('─'.repeat(50));
    console.log('Default accounts:');
    for (const account of DEFAULT_ACCOUNTS) {
      console.log(`  ${account.role.padEnd(15)} ${account.email}  /  ${account.password}`);
    }
    console.log('─'.repeat(50));
  } finally {
    await client.end();
  }
}

seed().catch((error: unknown) => {
  console.error('❌ Database seed failed:', error);
  process.exitCode = 1;
});
