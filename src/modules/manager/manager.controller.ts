import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/role.decorator.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { ManagerCreateDto } from './dto/manager-create.dto.js';
import { ManagerUpdateDto } from './dto/manager-update.dto.js';
import { ManagerService } from './providers/manager.service.js';

@Controller('manager')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: ManagerCreateDto) {
    return this.managerService.create(dto);
  }

  @Get()
  @Roles('ADMIN')
  findAll(@Query() query: PaginationQueryDto) {
    return this.managerService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.managerService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ManagerUpdateDto,
  ) {
    return this.managerService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.managerService.remove(id);
  }
}
