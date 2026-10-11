import { Module } from '@nestjs/common';
import { WorkerController } from './worker.controller.js';
import { WorkerService } from './providers/worker.service.js';

@Module({
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
