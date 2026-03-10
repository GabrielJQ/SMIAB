import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnmpService } from './snmp.service';
import { Printer } from '../printers/entities/printer.entity';
import { PrinterMonthlyStat } from '../printers/entities/printer-monthly-stat.entity';
import { Alert } from '../printers/entities/alert.entity';
import { PrinterStatusLog } from '../printers/entities/printer-status-log.entity';
import { PrinterTonerChange } from '../toners/entities/printer-toner-change.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Printer, PrinterMonthlyStat, Alert, PrinterStatusLog, PrinterTonerChange])],
    providers: [SnmpService],
})
export class SnmpModule { }
