import { Module } from '@nestjs/common';
import { ManagerController } from './manager.controller.js';
import { ManagerService } from './providers/manager.service.js';

@Module({
  controllers: [ManagerController],
  providers: [ManagerService],
})
export class ManagerModule {}
