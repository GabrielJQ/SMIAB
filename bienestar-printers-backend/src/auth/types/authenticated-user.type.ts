import type { SupabaseUser } from './supabase-user.type';

/**
 * @interface AuthenticatedUser
 * @description Estructura de contrato final asignada a 'request.user' tras pasar por el SupabaseAuthGuard.
 * Combina la identidad proveniente de GoTrue (Supabase) con la validación interna (Roles y Regiones de SAI).
 */
export interface AuthenticatedUser {
  supabase: SupabaseUser;
  internal: {
    id: string;
    email: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive' | 'suspended';
    unit_id: number | null;
    unit_name?: string | null;
    region_id: number | null;
    department_id: number | null;
  };
}
