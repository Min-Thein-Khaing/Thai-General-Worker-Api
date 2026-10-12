import { Module } from '@nestjs/common';
import { WorkerController } from './worker.controller.js';
import { WorkerService } from './providers/worker.service.js';
import { UploadModule } from '../upload/upload.module.js';

@Module({
  imports: [UploadModule],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
