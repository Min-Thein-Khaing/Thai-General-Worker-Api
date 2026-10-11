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
import { UserCreateDto } from './dto/user-create.dto.js';
import { UserUpdateDto } from './dto/user-update.dto.js';
import { UserService } from './providers/user.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/role.decorator.js';
import { RoleGuard } from '../../common/guards/role.guard.js';

const userImageInterceptor = FileInterceptor('image', {
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

@Controller('user')
@UseGuards(JwtAuthGuard,RoleGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('ADMIN')
  @UseInterceptors(userImageInterceptor)
  create(
    @Body() dto: UserCreateDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.userService.create(dto, image);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userService.findOne(id);
  }


  
  @Patch(':id')
  @Roles('ADMIN')
  @UseInterceptors(userImageInterceptor)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UserUpdateDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.userService.update(id, dto, image);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userService.remove(id);
  }
}
