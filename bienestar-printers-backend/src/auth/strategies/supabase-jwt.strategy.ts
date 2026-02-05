import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import type { SupabaseUser } from '../types/supabase-user.type';

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(
  Strategy,
  'supabase-jwt',
) {
  constructor(configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,

      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),

      audience: 'authenticated',
      issuer: `${supabaseUrl}/auth/v1`,
      algorithms: ['ES256'],
    });
  }

  async validate(payload: SupabaseUser): Promise<SupabaseUser> {
    // 🔥 DEVOLVER EL PAYLOAD TAL CUAL
    return payload;
  }
}

