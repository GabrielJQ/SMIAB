import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Printer } from '../printers/entities/printer.entity';
import { PrinterMonthlyStat } from '../printers/entities/printer-monthly-stat.entity';
import { PrinterTonerChange } from '../toners/entities/printer-toner-change.entity';
import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../users/users.module';

/**
 * @description Módulo empaquetador para el dominio de Reportes de Exportación Masiva.
 * Importa recursos cruzados (Impresoras y Estadísticas) para inyectarlos en el flujo matricial de reportes.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Printer, PrinterMonthlyStat, PrinterTonerChange]),
    AuthModule,
    UsersModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
