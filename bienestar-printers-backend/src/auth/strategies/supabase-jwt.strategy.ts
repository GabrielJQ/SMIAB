import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import type { SupabaseUser } from '../types/supabase-user.type';

/**
 * @class SupabaseJwtStrategy
 * @description Estrategia de Passport para validar tokens JWT emitidos por Supabase (GoTrue).
 * Utiliza certificados JWKS para verificar la firma de forma segura y descentralizada.
 */
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

  /**
   * @method validate
   * @description Extrae y devuelve el payload del JWT tras una verificación de firma exitosa.
   * @param {SupabaseUser} payload - Datos contenidos en el token.
   * @returns {Promise<SupabaseUser>} Payload validado.
   */
  async validate(payload: SupabaseUser): Promise<SupabaseUser> {
    return payload;
  }
}
