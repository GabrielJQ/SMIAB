import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseModule } from '../../integrations/supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SupabaseModule, ConfigModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
