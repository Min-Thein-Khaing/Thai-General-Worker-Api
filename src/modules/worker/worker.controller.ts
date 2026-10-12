import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/role.decorator.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { WorkerCreateDto } from './dto/worker-create.dto.js';
import { WorkerUpdateDto } from './dto/worker-update.dto.js';
import { WorkerService } from './providers/worker.service.js';

const workerImageInterceptor = FileInterceptor('image', {
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(
        new BadRequestException('Only JPEG, PNG, and WebP images are allowed'),
        false,
      );
      return;
    }

    callback(null, true);
  },
});

@Controller('worker')
@UseGuards(JwtAuthGuard, RoleGuard)
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post()
  @Roles('ADMIN')
  @UseInterceptors(workerImageInterceptor)
  create(
    @Body() dto: WorkerCreateDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.workerService.create(dto, image);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll() {
    return this.workerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.workerService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseInterceptors(workerImageInterceptor)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: WorkerUpdateDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.workerService.update(id, dto, image);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.workerService.remove(id);
  }
}
