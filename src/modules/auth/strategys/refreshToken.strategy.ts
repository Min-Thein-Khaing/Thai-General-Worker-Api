import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { schema } from '../../../db/index.js';
import { eq } from 'drizzle-orm';
import { Request } from 'express';
import { HashProvider } from '../providers/hash.provider.js';
interface JwtPayload {
  sub: string;
  email: string;
}
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    @Inject('DB')
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly configService: ConfigService,
    private readonly hashProvider: HashProvider,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_TOKEN_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const authRefresh = req.headers.authorization;
    if (!authRefresh) {
      throw new UnauthorizedException();
    }

    const refreshToken = authRefresh.replace(/^Bearer\s+/i, '').trim();

    const [user] = await this.db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, payload.sub))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException();
    }
if (!user || !user.refreshToken) {
      throw new UnauthorizedException();
    }

    const isMatch = await this.hashProvider.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isMatch) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}
