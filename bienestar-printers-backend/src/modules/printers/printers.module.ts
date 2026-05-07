import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintersController } from './printers.controller';
import { PrintersService } from './printers.service';
import { PrintersExcelService } from './printers-excel.service';
import { PrintersAccessService } from './printers-access.service';
import { PrintersStatsService } from './printers-stats.service';
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
import { ReportsModule } from '../reports/reports.module';
import { PrintersRepository } from './repositories/printers.repository';

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
    ReportsModule,
  ],
  controllers: [PrintersController],
  providers: [
    PrintersService,
    PrintersExcelService,
    PrintersAccessService,
    PrintersStatsService,
    PrintersRepository,
  ],
  exports: [
    PrintersService,
    PrintersExcelService,
    PrintersAccessService,
    PrintersStatsService,
    PrintersRepository,
  ],
})
export class PrintersModule {}
