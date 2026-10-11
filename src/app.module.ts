import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DbModule } from './db/db.module.js';
import { UserModule } from './modules/user/user.module.js';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module.js';
import { ThrottlerModule } from '@nestjs/throttler';
import { UploadModule } from './modules/upload/upload.module.js';
import { CompanyModule } from './modules/company/company.module.js';
import { YearModule } from './modules/year/year.module.js';
import { ManagerModule } from './modules/manager/manager.module.js';
import { WorkerModule } from './modules/worker/worker.module.js';
import { DocumentModule } from './modules/document/document.module.js';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    DbModule,
    UserModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
     ThrottlerModule.forRoot([
      {
        ttl: 60000, //1*60*1000ms
        limit: 10,
      },
    ]),
     UploadModule,
     CompanyModule,
     YearModule,
     ManagerModule,
     WorkerModule,
     DocumentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
