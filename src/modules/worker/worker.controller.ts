import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/role.decorator.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { WorkerCreateDto } from './dto/worker-create.dto.js';
import { WorkerUpdateDto } from './dto/worker-update.dto.js';
import { WorkerService } from './providers/worker.service.js';

@Controller('worker')
@UseGuards(JwtAuthGuard, RoleGuard)
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: WorkerCreateDto) {
    return this.workerService.create(dto);
  }

  @Get()
  @Roles('ADMIN','MANAGER')
  findAll() {
    return this.workerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.workerService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: WorkerUpdateDto,
  ) {
    return this.workerService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.workerService.remove(id);
  }
}
