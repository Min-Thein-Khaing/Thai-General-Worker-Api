import {
  Body,
  Controller,
  Header,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './providers/auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenGuard } from './guards/refresh-token.guard.js';
import { GetUser } from '../../common/decorators/getUser.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Header('Cache-Control', 'no-store')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh-token')
  @UseGuards(RefreshTokenGuard)
  refreshToken(@GetUser('id') id: string) {
    
    return this.authService.refreshToken(id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@GetUser('id') id: string) {
    return this.authService.logout(id);
  }
}
