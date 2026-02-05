import type { Request } from 'express';
import type { SupabaseUser } from './supabase-user.type';

export interface InternalUser {
  id: string;
  supabase_user_id: string;
  email: string;
  role: 'user' | 'admin';
  status: string;
  created_at: string;
}

export interface RequestWithUser extends Request {
  user: {
    supabase: SupabaseUser;
    internal: InternalUser;
  };
}

