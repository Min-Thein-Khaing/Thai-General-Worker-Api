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
import { YearCreateDto } from './dto/year-create.dto.js';
import { YearUpdateDto } from './dto/year-update.dto.js';
import { YearService } from './providers/year.service.js';

@Controller('year')
@UseGuards(JwtAuthGuard, RoleGuard)
export class YearController {
  constructor(private readonly yearService: YearService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: YearCreateDto) {
    return this.yearService.create(dto);
  }

  @Get()
  @Roles('ADMIN')
  findAll(@Query() query: PaginationQueryDto) {
    return this.yearService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.yearService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: YearUpdateDto,
  ) {
    return this.yearService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.yearService.remove(id);
  }
}
