import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

/**
 * @class SupabaseService
 * @description Proveedor genérico para inicializar y mantener vivo un cliente de Supabase privilegiado en el backend.
 * Implementa OnModuleInit para asegurar la inyección de claves Service Role durante el arranque.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private adminClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!url || !serviceRoleKey) {
      throw new Error('Supabase environment variables missing');
    }

    this.adminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  /**
   * @method getAdminClient
   * @description Retorna una instancia unificada de acceso pleno (Service Role) a Supabase.
   * IMPORTANTE: Esta instancia puentea (bypasses) Row Level Security (RLS). Debe ser usada exclusivamente
   * por servicios del backend para validación, auditoría o accesos administrativos justificados.
   * @returns {SupabaseClient} Cliente de Supabase con privilegios máximos de lectura y escritura.
   */
  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }
}
