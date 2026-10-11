import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from './index.js';

const localTestAccounts = [
  {
    id: randomUUID(),
    fullName: 'Local Test Admin',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'ADMIN',
  },
  {
    id: randomUUID(),
    fullName: 'Local Test Manager',
    email: 'manager@example.com',
    password: 'Manager123!',
    role: 'MANAGER',
  },
  {
    id: randomUUID(),
    fullName: 'Local Test Worker',
    email: 'worker@example.com',
    password: 'Worker123!',
    role: 'GENERAL_WORKER',
  },
] as const;

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must point to a local PostgreSQL database.');
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
        `Run "npm run db:seed:prod" to seed a production database.`,
      );
    }
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    const [admin, managerAccount, workerAccount] = await Promise.all(
      localTestAccounts.map(async (account) => ({
        ...account,
        password: await bcrypt.hash(account.password, 10),
      })),
    );

    const companyId = randomUUID();
    const yearId = randomUUID();
    const managerId = randomUUID();
    const workerId = randomUUID();

    await db.transaction(async (tx) => {
      await tx.delete(schema.document);
      await tx.delete(schema.worker);
      await tx.delete(schema.manager);
      await tx.delete(schema.year);
      await tx.delete(schema.company);
      await tx.delete(schema.user);

      await tx.insert(schema.user).values([
        { ...admin, isArchived: false },
        { ...managerAccount, isArchived: false },
        { ...workerAccount, isArchived: false },
      ]);

      await tx.insert(schema.company).values({
        id: companyId,
        userId: admin.id,
        companyName: 'Local Test Company',
        address: 'Local development data',
      });

      await tx.insert(schema.year).values({
        id: yearId,
        userId: admin.id,
        startYear: '2026-01-01',
        endYear: '2026-12-31',
      });

      await tx.insert(schema.manager).values({
        id: managerId,
        userId: managerAccount.id,
        companyId,
        gender: 'MALE',
      });

      await tx.insert(schema.worker).values({
        id: workerId,
        userId: workerAccount.id,
        managerId,
        yearId,
        companyId,
        gender: 'MALE',
      });
    });

    console.log('Local database seeded successfully.');
    for (const account of localTestAccounts) {
      console.log(`${account.role}: ${account.email} / ${account.password}`);
    }
  } finally {
    await client.end();
  }
}

seed().catch((error: unknown) => {
  console.error('Local database seed failed:', error);
  process.exitCode = 1;
});
