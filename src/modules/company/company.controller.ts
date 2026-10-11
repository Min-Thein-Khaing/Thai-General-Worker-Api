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
import { CompanyCreateDto } from './dto/company-create.dto.js';
import { CompanyUpdateDto } from './dto/company-update.dto.js';
import { CompanyService } from './providers/company.service.js';

@Controller('company')
@UseGuards(JwtAuthGuard, RoleGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CompanyCreateDto) {
    return this.companyService.create(dto);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CompanyUpdateDto,
  ) {
    return this.companyService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.companyService.remove(id);
  }
}
