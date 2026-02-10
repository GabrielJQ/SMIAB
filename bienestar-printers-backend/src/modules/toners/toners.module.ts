import { Module } from '@nestjs/common';
import { TonersController } from './toners.controller';
import { TonersService } from './toners.service';
import { SupabaseModule } from '../../integrations/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [SupabaseModule, AuthModule, UsersModule],
    controllers: [TonersController],
    providers: [TonersService],
})
export class TonersModule { }
