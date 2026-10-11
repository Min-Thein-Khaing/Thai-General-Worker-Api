import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from './index.js';

@Global()
@Module({
  providers: [
    {
      provide: 'DB',
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }

        const client = postgres(databaseUrl);
        return drizzle(client, { schema });
      },
    },
  ],
  exports: ['DB'],
})
export class DbModule {}