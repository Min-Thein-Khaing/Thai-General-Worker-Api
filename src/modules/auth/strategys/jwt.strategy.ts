import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { schema } from '../../../db/index.js';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';

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
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: PayLoad) {
    const { sub: id, email } = payload;
    const [user] = await this.db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, id))
      .limit(1);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
