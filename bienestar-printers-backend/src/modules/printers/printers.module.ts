import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintersController } from './printers.controller';
import { PrintersService } from './printers.service';
import { ReportService } from './report.service';
import { UsersModule } from '../users/users.module';
import { SupabaseModule } from '../../integrations/supabase/supabase.module';
import { Printer } from './entities/printer.entity';
import { PrinterMonthlyStat } from './entities/printer-monthly-stat.entity';
import { Alert } from './entities/alert.entity';
import { PrinterStatusLog } from './entities/printer-status-log.entity';
import { PrinterTonerChange } from '../toners/entities/printer-toner-change.entity';
import { Unit } from './entities/unit.entity';
import { Department } from './entities/department.entity';
import { Region } from './entities/region.entity';
import { Asset } from './entities/asset.entity';
import { Employee } from './entities/employee.entity';
import { AssetAssignment } from './entities/asset-assignment.entity';
import { Address } from './entities/address.entity';
import { SnmpModule } from '../snmp/snmp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Printer,
      PrinterMonthlyStat,
      Alert,
      PrinterStatusLog,
      PrinterTonerChange,
      Unit,
      Department,
      Region,
      Asset,
      Employee,
      AssetAssignment,
      Address,
    ]),
    UsersModule,
    SupabaseModule,
    SnmpModule,
  ],
  controllers: [PrintersController],
  providers: [PrintersService, ReportService],
  exports: [PrintersService, ReportService],
})
export class PrintersModule {}
