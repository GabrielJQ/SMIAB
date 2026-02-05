import type { SupabaseUser } from './supabase-user.type';

export interface AuthenticatedUser {
  supabase: SupabaseUser;
  internal: {
    id: string;
    email: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive' | 'suspended';
    area_id: number | null ; 
  };
}
