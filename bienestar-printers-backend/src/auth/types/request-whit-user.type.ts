import type { Request } from 'express';
import type { SupabaseUser } from './supabase-user.type';

/**
 * @interface InternalUser
 * @description Representa la estructura estricta del usuario según el modelo relacional de la base de datos interna (SAI/SMIAB).
 */
export interface InternalUser {
  id: string;
  supabase_user_id: string;
  email: string;
  role: 'user' | 'admin';
  status: string;
  created_at: string;
}

/**
 * @interface RequestWithUser
 * @description Alternativa explícita al tipado global, utilizada en contextos donde inyectar 'Express.Request' puro no es ideal.
 */
export interface RequestWithUser extends Request {
  user: {
    supabase: SupabaseUser;
    internal: InternalUser;
  };
}
