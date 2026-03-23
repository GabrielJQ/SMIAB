/**
 * @interface SupabaseUser
 * @description Contrato definido por Supabase GoTrue que dicta todos los claims estándar de JWT y los estandarizados de la plataforma.
 * Actúa como DTO de entrada durante la validación del Token.
 */
export interface SupabaseUser {
  // JWT standard
  iss: string;
  sub: string; // user id (UUID)
  aud: string;
  exp: number;
  iat: number;

  // Supabase identity
  email?: string;
  phone?: string;

  /**
   * Rol base de Supabase (NO es autorización de negocio)
   * Ej: authenticated | anon
   */
  role: string;

  app_metadata: {
    provider?: string;
    providers?: string[];
    [key: string]: any;
  };

  user_metadata: {
    [key: string]: any;
  };

  // Auth assurance
  aal?: string;
  amr?: {
    method: string;
    timestamp: number;
  }[];

  session_id?: string;
  is_anonymous?: boolean;

  /**
   * 👇 FUTURO (autorización de negocio)
   * Estos no vienen aún, pero los usaremos luego
   */
  roles?: string[];
  permissions?: string[];
}
