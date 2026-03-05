import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnmpService } from './snmp.service';
import { Printer } from '../printers/entities/printer.entity';
import { PrinterMonthlyStat } from '../printers/entities/printer-monthly-stat.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Printer, PrinterMonthlyStat])],
    providers: [SnmpService],
})
export class SnmpModule { }
