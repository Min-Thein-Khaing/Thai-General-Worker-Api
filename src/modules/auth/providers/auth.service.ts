import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as crypto from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import * as schema from '../../../db/schema/index.js';
import { user } from '../../../db/schema/user.js';
import { LoginDto } from '../dto/login.dto.js';
import { HashProvider } from './hash.provider.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DB')
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly hashPassword: HashProvider,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly hashProvider: HashProvider,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const { password } = dto;

    const [userRecord] = await this.db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1);

    if (!userRecord) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashPassword.compare(
      password,
      userRecord.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(userRecord.id, userRecord.email);
    await this.updateRefreshToken(userRecord.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: userRecord.id,
        fullName: userRecord.fullName,
        email: userRecord.email,
        role: userRecord.role,
        imageUrl: userRecord.imageUrl,
      },
    };
  }

  private async generateTokens(
    id: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: id, email };
    const refreshIdToken = crypto.randomBytes(32).toString('hex');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(
        { ...payload, refreshIdToken },
        {
          secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(id: string, refreshToken: string) {
const hashedRefreshToken = await this.hashProvider.hash(refreshToken);
    await this.db
      .update(user)
      .set({ refreshToken:  hashedRefreshToken })
      .where(eq(user.id, id));
  }

  async logout(id: string) {
    await this.db
      .update(user)
      .set({ refreshToken: null })
      .where(eq(user.id, id));
  }

  async refreshToken(id: string) {
    const [userRecord] = await this.db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, id))
      .limit(1);

    const tokens = await this.generateTokens(userRecord.id, userRecord.email);
    await this.updateRefreshToken(userRecord.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        fullName: userRecord.fullName,
        role: userRecord.role,
      },
    };
  }
}
