import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintersController } from './printers.controller';
import { PrintersService } from './printers.service';
import { UsersModule } from '../users/users.module';
import { SupabaseModule } from "../../integrations/supabase/supabase.module";
import { Printer } from './entities/printer.entity';
import { PrinterMonthlyStat } from './entities/printer-monthly-stat.entity';
import { Alert } from './entities/alert.entity';
import { PrinterStatusLog } from './entities/printer-status-log.entity';
import { PrinterTonerChange } from '../toners/entities/printer-toner-change.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Printer, PrinterMonthlyStat, Alert, PrinterStatusLog, PrinterTonerChange]),
    UsersModule,
    SupabaseModule
  ],
  controllers: [PrintersController],
  providers: [PrintersService],
  exports: [PrintersService],
})
export class PrintersModule { }
