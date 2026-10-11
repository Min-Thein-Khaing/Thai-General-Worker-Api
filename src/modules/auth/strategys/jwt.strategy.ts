import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { schema } from '../../../db/index.js';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';

interface PayLoad {
  sub: string;
  email: string;
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('DB')
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: PayLoad) {
    const id = payload.sub;
    const [user] = await this.db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        fullName: schema.user.fullName,
        role: schema.user.role,
      })
      .from(schema.user)
      .where(
        and(
          eq(schema.user.id, id),
          eq(schema.user.isArchived, false),
        ),
      )
      .limit(1);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
