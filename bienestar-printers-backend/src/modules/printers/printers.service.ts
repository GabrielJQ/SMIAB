import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

// Basic Queries / DTOs
import { PrintersRepository } from './repositories/printers.repository';
import { PrinterSummaryDto } from './dto/printer-summary.dto';

// Entities
import { PrinterMonthlyStat } from './entities/printer-monthly-stat.entity';
import { Printer } from './entities/printer.entity';
import { PrinterTonerChange } from '../toners/entities/printer-toner-change.entity';
import { PrinterStatusLog } from './entities/printer-status-log.entity';
import { Alert } from './entities/alert.entity';

import { PrintersAccessService } from './printers-access.service';

/**
 * @class PrintersService
 * @description Servicio core para operaciones básicas de impresoras. 
 * Delega la seguridad a PrintersAccessService y la analítica a PrintersStatsService.
 */
@Injectable()
export class PrintersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly accessService: PrintersAccessService,
    private readonly printersRepository: PrintersRepository,
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
    @InjectRepository(PrinterMonthlyStat)
    private readonly printerMonthlyStatRepository: Repository<PrinterMonthlyStat>,
    @InjectRepository(PrinterStatusLog)
    private readonly printerStatusLogRepository: Repository<PrinterStatusLog>,
    @InjectRepository(PrinterTonerChange)
    private readonly tonerChangeRepository: Repository<PrinterTonerChange>,
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) {}

  // ==========================================
  //  BASIC PRINTER METHODS
  // ==========================================

  async getPrintersByUserArea(areaId: string) {
    const rows = await this.printersRepository.getPrintersByAreaQuery(areaId);
    if (!rows) return [];
    return rows.map((row) => new PrinterSummaryDto(row));
  }

  async getPrintersByUnit(userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
    const rows = await this.printersRepository.getPrintersByUnitQuery(userUnitId);
    if (!rows) return [];
    return rows.map((row) => new PrinterSummaryDto(row));
  }

  async getPrinterById(printerId: string, userUnitId: string) {
    const printer = await this.accessService.validatePrinterAccess(printerId, userUnitId);
    return new PrinterSummaryDto(printer);
  }

  async registerManualTonerChange(printerId: string, userUnitId: string) {
    await this.accessService.validatePrinterAccess(printerId, userUnitId);
    const change = this.tonerChangeRepository.create({
      assetId: printerId,
      changedAt: new Date(),
      detectionType: 'manual',
    });
    await this.tonerChangeRepository.save(change);
    return { success: true, message: 'Manual toner change registered' };
  }

  async getOperationalStatus(userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const totalCount = await this.printerRepository.count({ where: { unitId: userUnitId } });
    const onlineCount = await this.printerRepository.createQueryBuilder('p')
      .where('p.unit_id = :unitId', { unitId: userUnitId })
      .andWhere('p.printer_status = :status', { status: 'online' })
      .andWhere('p.last_read_at >= :ago', { ago: startOfToday })
      .getCount();

    return { total: totalCount, online: onlineCount, offline: totalCount - onlineCount };
  }

  // ==========================================
  //  ALERTS (OPERATIONAL)
  // ==========================================

  async getActiveAlerts(printerId: string, userUnitId: string) {
    await this.accessService.validatePrinterAccess(printerId, userUnitId);
    return await this.alertRepository.find({
      where: { printerId, status: 'PENDING' },
      order: { createdAt: 'DESC' },
    });
  }

  async resolveAlert(alertId: string, userUnitId: string) {
    const alert = await this.alertRepository.findOne({ where: { id: alertId }, relations: ['printer'] });
    if (!alert) throw new BadRequestException('Alert not found');
    await this.accessService.validatePrinterAccess(alert.printerId, userUnitId);

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date();
    await this.alertRepository.save(alert);
    return { success: true, message: 'Alert resolved successfully' };
  }
}
