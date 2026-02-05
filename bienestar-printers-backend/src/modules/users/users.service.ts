import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) { }

  async findBySupabaseUserId(supabaseUserId: string) {
    const client = this.supabase.getAdminClient();

    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ?? null;
  }

  async createFromSupabase(payload: {
    supabaseUserId: string;
    email: string;
    areaId?: number;
  }) {
    const client = this.supabase.getAdminClient();

    const { data, error } = await client
      .from('users')
      .insert({
        supabase_user_id: payload.supabaseUserId,
        email: payload.email,
        role: 'user',
        area_id: payload.areaId ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}

