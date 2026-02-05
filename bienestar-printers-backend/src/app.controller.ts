import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from './integrations/supabase/supabase.service';

@Controller()
export class AppController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('health/supabase')
  async testSupabase() {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(2);

    if (error) {
      return { ok: false, error };
    }

    return { ok: true, data };
  }
}



