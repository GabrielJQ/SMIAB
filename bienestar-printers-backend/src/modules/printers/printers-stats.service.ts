import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Printer } from './entities/printer.entity';
import { PrinterMonthlyStat } from './entities/printer-monthly-stat.entity';
import { PrinterStatusLog } from './entities/printer-status-log.entity';
import { PrinterTonerChange } from '../toners/entities/printer-toner-change.entity';
import { Alert } from './entities/alert.entity';
import { PrintersAccessService } from './printers-access.service';

// Queries / DTOs
import { getPrinterHistoryQuery } from './queries/get-printer-history.query';
import { getPrinterYearlySummaryQuery } from './queries/get-printer-yearly-summary.query';
import { getPrinterComparisonQuery } from './queries/get-printer-comparison.query';
import { getUnitHistoryQuery } from './queries/get-unit-history.query';
import { getPrinterByIdQuery } from './queries/get-printer-by-id.query';
import { PrinterHistoryDto } from './dto/printer-history.dto';
import { PrinterYearlySummaryDto } from './dto/printer-yearly-summary.dto';
import { PrinterComparisonDto } from './dto/printer-comparison.dto';

@Injectable()
export class PrintersStatsService {
  constructor(
    private readonly accessService: PrintersAccessService,
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
    @InjectRepository(PrinterMonthlyStat)
    private readonly printerMonthlyStatRepository: Repository<PrinterMonthlyStat>,
    @InjectRepository(PrinterStatusLog)
    private readonly printerStatusLogRepository: Repository<PrinterStatusLog>,
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
  ) {}

  async getPrinterHistory(
    printerId: string,
    userAreaId: string,
    filters: { startYear?: number; startMonth?: number; endYear?: number; endMonth?: number },
  ) {
    await this.accessService.validatePrinterAccess(printerId, userAreaId);

    const rows = await getPrinterHistoryQuery(this.printerMonthlyStatRepository, { printerId, ...filters });

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const isCurrentInYearRange = (!filters.startYear || currentYear >= filters.startYear) && 
                                  (!filters.endYear || currentYear <= filters.endYear);
    
    if (isCurrentInYearRange && !rows.some(r => r.year === currentYear && r.month === currentMonth)) {
        const printer = await getPrinterByIdQuery(this.printerRepository, printerId);
        if (printer && Number(printer.totalPagesPrinted) > 0) {
            let prevM = currentMonth - 1, prevY = currentYear;
            if (prevM === 0) { prevM = 12; prevY = currentYear - 1; }

            const lastClosure = await this.printerMonthlyStatRepository.findOne({
                where: { assetId: printerId, year: prevY, month: prevM }
            });

            if (lastClosure) {
                const delta = Number(printer.totalPagesPrinted) - Number(lastClosure.printTotalReading || 0);
                if (delta > 0) {
                    rows.push({
                        year: currentYear, month: currentMonth,
                        printTotalDelta: delta.toString(), printOnlyDelta: delta.toString(), copyDelta: '0'
                    } as any);
                }
            }
        }
    }
    return rows.map((row) => new PrinterHistoryDto(row));
  }

  async getMonthlyStats(printerId: string, userAreaId: string) {
    await this.accessService.validatePrinterAccess(printerId, userAreaId);

    const rawData = await this.printerMonthlyStatRepository
      .createQueryBuilder('stats')
      .select('stats.year', 'year')
      .addSelect('stats.month', 'month')
      .addSelect('CAST(SUM(stats.print_total_delta) AS INTEGER)', 'totalImpressions')
      .addSelect('CAST(SUM(stats.print_only_delta) AS INTEGER)', 'printOnly')
      .addSelect('CAST(SUM(stats.copy_delta) AS INTEGER)', 'copies')
      .addSelect((subQuery) => {
        return subQuery
          .select('CAST(COUNT(toner.id) AS INTEGER)', 'count')
          .from(PrinterTonerChange, 'toner')
          .where('toner.asset_id = stats.asset_id')
          .andWhere('EXTRACT(YEAR FROM toner.changed_at) = stats.year')
          .andWhere('EXTRACT(MONTH FROM toner.changed_at) = stats.month');
      }, 'tonerChanges')
      .where('stats.asset_id = :printerId', { printerId })
      .groupBy('stats.year').addGroupBy('stats.month').addGroupBy('stats.asset_id')
      .orderBy('stats.year', 'ASC').addOrderBy('stats.month', 'ASC')
      .getRawMany();

    const formattedData = rawData.map((row) => ({
      year: Number(row.year), month: Number(row.month),
      totalImpressions: Number(row.totalImpressions || 0),
      printOnly: Number(row.printOnly || 0), copies: Number(row.copies || 0),
      tonerChanges: Number(row.tonerChanges || 0),
    }));

    const today = new Date(), currentYear = today.getFullYear(), currentMonth = today.getMonth() + 1;

    if (!formattedData.some(d => d.year === currentYear && d.month === currentMonth)) {
        const printer = await getPrinterByIdQuery(this.printerRepository, printerId);
        if (printer && Number(printer.totalPagesPrinted) > 0) {
            let prevM = currentMonth - 1, prevY = currentYear;
            if (prevM === 0) { prevM = 12; prevY = currentYear - 1; }
            const lastClosure = await this.printerMonthlyStatRepository.findOne({
                where: { assetId: printerId, year: prevY, month: prevM }
            });
            if (lastClosure) {
                const delta = Number(printer.totalPagesPrinted) - Number(lastClosure.printTotalReading || 0);
                if (delta > 0) {
                    formattedData.push({
                        year: currentYear, month: currentMonth,
                        totalImpressions: delta, printOnly: delta, copies: 0, tonerChanges: 0,
                    });
                }
            }
        }
    }
    return formattedData;
  }

  async getPrinterYearlySummary(printerId: string, userAreaId: string, year: number) {
    await this.accessService.validatePrinterAccess(printerId, userAreaId);
    const rows = await getPrinterYearlySummaryQuery(this.printerMonthlyStatRepository, printerId, year);
    return new PrinterYearlySummaryDto(year, rows);
  }

  async getPrinterComparison(printerId: string, userAreaId: string, months: number) {
    await this.accessService.validatePrinterAccess(printerId, userAreaId);
    const rows = await getPrinterComparisonQuery(this.printerMonthlyStatRepository, printerId, months);
    return rows.map((row) => new PrinterComparisonDto(row));
  }

  async getUnitHistory(userUnitId: string, year: number, month: number) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
    const rows = await getUnitHistoryQuery(this.printerMonthlyStatRepository, userUnitId, year, month);
    const today = new Date(), currentYear = today.getFullYear(), currentMonth = today.getMonth() + 1;

    if (year === currentYear && month >= currentMonth && !rows.some(r => r.month === currentMonth)) {
        let prevM = currentMonth - 1, prevY = currentYear;
        if (prevM === 0) { prevM = 12; prevY = currentYear - 1; }
        const dynamicSum = await this.printerRepository.createQueryBuilder('p')
            .leftJoin('p.monthlyStats', 's', 's.year = :prevY AND s.month = :prevM', { prevY, prevM })
            .select('SUM(CASE WHEN s.print_total_reading IS NULL THEN 0 ELSE (p.total_pages_printed::bigint - s.print_total_reading::bigint) END)', 'total')
            .where('p.unit_id = :unitId', { unitId: userUnitId })
            .andWhere('CASE WHEN s.print_total_reading IS NULL THEN 0 ELSE (p.total_pages_printed::bigint - s.print_total_reading::bigint) END > 10')
            .getRawOne();

        const totalValue = Number(dynamicSum?.total || 0);
        if (totalValue > 0) {
            rows.push({ year: currentYear, month: currentMonth, print_total: totalValue, print_only: totalValue, copies: 0 } as any);
        }
    }
    return rows;
  }

  async getUnitTonerStats(userUnitId: string, year: number, month: number) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
    const rawData = await this.printerRepository.manager.createQueryBuilder(PrinterTonerChange, 'toner')
      .innerJoin('toner.printer', 'printer')
      .select('EXTRACT(YEAR FROM toner.changed_at)', 'year').addSelect('EXTRACT(MONTH FROM toner.changed_at)', 'month')
      .addSelect('CAST(COUNT(toner.id) AS INTEGER)', 'changes')
      .where('printer.unit_id = :unitId', { unitId: userUnitId })
      .andWhere('EXTRACT(YEAR FROM toner.changed_at) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM toner.changed_at) <= :month', { month })
      .groupBy('EXTRACT(YEAR FROM toner.changed_at)').addGroupBy('EXTRACT(MONTH FROM toner.changed_at)')
      .orderBy('EXTRACT(YEAR FROM toner.changed_at)', 'ASC').addOrderBy('EXTRACT(MONTH FROM toner.changed_at)', 'ASC')
      .getRawMany();

    return rawData.map((row) => ({ year: Number(row.year), month: Number(row.month), changes: Number(row.changes || 0) }));
  }

  async getUnitTopPrintConsumers(userUnitId: string, year: number, month: number) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
    const rawData = await this.printerMonthlyStatRepository.createQueryBuilder('stats').innerJoin('stats.printer', 'printer')
      .select('printer.assetId', 'printerId').addSelect('printer.namePrinter', 'name')
      .addSelect('CAST(SUM(stats.print_total_delta) AS INTEGER)', 'totalImpressions')
      .where('printer.unitId = :unitId', { unitId: userUnitId }).andWhere('stats.year = :year', { year }).andWhere('stats.month = :month', { month })
      .groupBy('printer.assetId').addGroupBy('printer.namePrinter')
      .orderBy('CAST(SUM(stats.print_total_delta) AS INTEGER)', 'DESC').getRawMany();

    const today = new Date();
    if (rawData.length === 0 && year === today.getFullYear() && month === (today.getMonth() + 1)) {
        let prevM = month - 1, prevY = year; if (prevM === 0) { prevM = 12; prevY = year - 1; }
        const dynamicData = await this.printerRepository.createQueryBuilder('printer')
          .leftJoin('printer.monthlyStats', 'prevstats', 'prevstats.year = :prevY AND prevstats.month = :prevM', { prevY, prevM })
          .select('printer.assetId', 'printerId').addSelect('printer.namePrinter', 'name')
          .addSelect('CAST(CASE WHEN prevstats.print_total_reading IS NULL THEN 0 ELSE printer.total_pages_printed::bigint - prevstats.print_total_reading::bigint END AS INTEGER)', 'totalImpressions')
          .where('printer.unitId = :unitId', { unitId: userUnitId })
          .orderBy('CAST(CASE WHEN prevstats.print_total_reading IS NULL THEN 0 ELSE printer.total_pages_printed::bigint - prevstats.print_total_reading::bigint END AS INTEGER)', 'DESC')
          .limit(10).getRawMany();

        return dynamicData.map(row => ({ printerId: row.printerId, name: row.name, totalImpressions: Number(row.totalImpressions || 0) }));
    }
    return rawData.map((row) => ({ printerId: row.printerId, name: row.name, totalImpressions: Number(row.totalImpressions || 0) }));
  }

  async getUnitCombinedTopConsumers(userUnitId: string) {
    const today = new Date();
    const mxTime = new Date(today.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    const targetYear = mxTime.getFullYear(), displayMonth = mxTime.getMonth() + 1; 
    let prevM = displayMonth - 1, prevY = targetYear; if (prevM === 0) { prevM = 12; prevY = targetYear - 1; }

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const periodLabel = `${monthNames[displayMonth - 1]} ${targetYear}`;

    const rawData = await this.printerRepository.createQueryBuilder('printer')
      .leftJoin('printer.monthlyStats', 'prevstats', 'prevstats.year = :prevY AND prevstats.month = :prevM', { prevY, prevM })
      .leftJoin('printer.tonerChanges', 'tonerchanges', 'EXTRACT(YEAR FROM tonerchanges.changed_at) = :targetYear AND EXTRACT(MONTH FROM tonerchanges.changed_at) = :displayMonth', { targetYear, displayMonth })
      .select('printer.assetId', 'printerId').addSelect('printer.namePrinter', 'name').addSelect('printer.printerStatus', 'status')
      .addSelect('CAST(SUM(CASE WHEN prevstats.print_total_reading IS NULL THEN 0 ELSE (printer.total_pages_printed::bigint - prevstats.print_total_reading::bigint) END) AS INTEGER)', 'impressions')
      .addSelect('CAST(COUNT(tonerchanges.id) AS INTEGER)', 'tonerChanges')
      .where('printer.unitId = :unitId', { unitId: userUnitId })
      .andWhere('CASE WHEN prevstats.print_total_reading IS NULL THEN 0 ELSE (printer.total_pages_printed::bigint - prevstats.print_total_reading::bigint) END > 10')
      .groupBy('printer.assetId').addGroupBy('printer.namePrinter').addGroupBy('printer.printerStatus')
      .orderBy('CAST(SUM(CASE WHEN prevstats.print_total_reading IS NULL THEN 0 ELSE (printer.total_pages_printed::bigint - prevstats.print_total_reading::bigint) END) AS INTEGER)', 'DESC')
      .limit(5).getRawMany();

    return { periodLabel, data: rawData.map((row) => ({ printerId: row.printerId, name: row.name, status: row.status, impressions: Number(row.impressions || 0), tonerChanges: Number(row.tonerChanges || 0) })) };
  }

  async getTonerHistory(printerId: string, userAreaId: string) {
    await this.accessService.validatePrinterAccess(printerId, userAreaId);
    const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
    const logs = await this.printerStatusLogRepository.find({ where: { printerId, recordedAt: MoreThanOrEqual(thirtyDaysAgo) }, order: { recordedAt: 'ASC' } });

    return logs.map((log) => {
      const d = log.recordedAt;
      return {
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        time: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'),
        tonerLevel: log.tonerLevel,
      };
    });
  }

  async getPrintersRequiringAttention(userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
    const alerts = await this.alertRepository.find({
      where: { status: 'PENDING', printer: { unitId: userUnitId } },
      relations: ['printer', 'printer.department'],
      order: { createdAt: 'DESC' },
    });

    return alerts.map((alert) => ({
      alertId: alert.id, type: alert.type, createdAt: alert.createdAt, metadata: alert.metadata,
      printer: { id: alert.printer.assetId, name: alert.printer.namePrinter, ip: alert.printer.ipPrinter, tonerLevel: alert.printer.tonerLvl, area: alert.printer.department?.areanom || 'Sin Área' },
    }));
  }
}
