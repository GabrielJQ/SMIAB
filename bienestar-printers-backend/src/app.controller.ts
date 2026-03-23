import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from './integrations/supabase/supabase.service';

/**
 * @class AppController
 * @description Controlador base útil para verificaciones de salud (Health Checks) y rutas fundamentales de la aplicación.
 */
@Controller()
export class AppController {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * @method testSupabase
   * @description Endpoint de diagnóstico (Health Check) para comprobar la conectividad del servidor backend con Supabase.
   * Valida que la llave de servicio (Service Role Key) pueda realizar una consulta básica.
   * @returns {Promise<{ok: boolean, error?: any, data?: any}>} El resultado de la prueba de conexión.
   */
  @Get('health/supabase')
  async testSupabase() {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase.from('users').select('*').limit(2);

    if (error) {
      return { ok: false, error };
    }

    return { ok: true, data };
  }
}
