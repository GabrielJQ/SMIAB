import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnmpService } from './snmp.service';
import { Printer } from '../printers/entities/printer.entity';
import { PrinterMonthlyStat } from '../printers/entities/printer-monthly-stat.entity';
import { Alert } from '../printers/entities/alert.entity';
import { PrinterStatusLog } from '../printers/entities/printer-status-log.entity';
import { PrinterTonerChange } from '../toners/entities/printer-toner-change.entity';
import { TelemetryProcessor } from './processors/telemetry.processor';
import { PrintersModule } from '../printers/printers.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Printer,
      PrinterMonthlyStat,
      Alert,
      PrinterStatusLog,
      PrinterTonerChange,
    ]),
    forwardRef(() => PrintersModule),
    forwardRef(() => ReportsModule),
  ],
  providers: [SnmpService, TelemetryProcessor],
  exports: [SnmpService, TelemetryProcessor],
})
export class SnmpModule {}
