import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TonersController } from './toners.controller';
import { TonersService } from './toners.service';
import { SupabaseModule } from '../../integrations/supabase/supabase.module';
import { Printer } from '../printers/entities/printer.entity';
import { PrinterTonerChange } from './entities/printer-toner-change.entity';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PrinterTonerChange, Printer]),
    SupabaseModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [TonersController],
  providers: [TonersService],
  exports: [TonersService],
})
export class TonersModule {}
