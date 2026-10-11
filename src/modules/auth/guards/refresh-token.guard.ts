import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

//Guard to protect the refresh token route, using the 'jwt-refresh' strategy defined in RefreshTokenStrategy
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}