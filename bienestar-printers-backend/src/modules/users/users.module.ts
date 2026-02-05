import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseModule } from '../../integrations/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
