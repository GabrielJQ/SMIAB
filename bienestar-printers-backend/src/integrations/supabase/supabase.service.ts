import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private adminClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceRoleKey) {
      throw new Error('Supabase environment variables missing');
    }

    this.adminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  /** 👑 Cliente con SERVICE ROLE (backend only) */
  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }
}

