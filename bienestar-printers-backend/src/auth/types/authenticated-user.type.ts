import type { SupabaseUser } from './supabase-user.type';

export interface AuthenticatedUser {
  supabase: SupabaseUser;
  internal: {
    id: string;
    email: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive' | 'suspended';
    unit_id: number | null;
    region_id: number | null;
    department_id: number | null;
  };
}
