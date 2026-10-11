import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

function run(command: string, args: string[], env = process.env) {
  const result = spawnSync(command, args, { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Command failed with exit code ${result.status ?? 'unknown'}`);
  }
}

async function migrateAndSeed() {
  const isForce = process.argv.includes('--force');
  const isConfirmed = process.argv.includes('--confirm-reset');

  if (!isForce && !isConfirmed) {
    throw new Error(
      'This command clears all app data. Rerun with --confirm-reset (local) or use "npm run db:migrate:seed:prod" (production).',
    );
  }

  // Localhost guard — skip only when --force is passed (production mode)
  if (!isForce) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be set.');
    }
    const databaseHost = new URL(databaseUrl).hostname
      .replace(/^\[|\]$/g, '')
      .toLowerCase();
    if (!['localhost', '127.0.0.1', '::1'].includes(databaseHost)) {
      throw new Error(
        `Refusing to reset non-local database host "${databaseHost}". Use "npm run db:migrate:seed:prod".`,
      );
    }
  }

  const drizzleKitCli = resolve(
    process.cwd(),
    'node_modules',
    'drizzle-kit',
    'bin.cjs',
  );
  const seedScript = resolve(process.cwd(), 'dist', 'db', 'seed.js');

  console.log('Applying Drizzle schema to the database...');
  run(process.execPath, [drizzleKitCli, 'push']);

  console.log('Clearing app data and inserting seed accounts...');
  run(process.execPath, [seedScript, '--force']);
}

migrateAndSeed().catch((error: unknown) => {
  console.error('migrate-and-seed failed:', error);
  process.exitCode = 1;
});
