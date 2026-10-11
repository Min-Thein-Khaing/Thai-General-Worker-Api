import { Module } from '@nestjs/common';
import { UserService } from './providers/user.service.js';
import { UploadModule } from '../upload/upload.module.js';
import { UserController } from './user.controller.js';

@Module({
  imports: [UploadModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
