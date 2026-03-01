import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TonersController } from './toners.controller';
import { TonersService } from './toners.service';
import { SupabaseModule } from '../../integrations/supabase/supabase.module';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PrinterTonerChange } from './entities/printer-toner-change.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([PrinterTonerChange]),
        SupabaseModule,
        AuthModule,
        UsersModule
    ],
    controllers: [TonersController],
    providers: [TonersService],
})
export class TonersModule { }
