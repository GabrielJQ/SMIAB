import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

// Basic Queries / DTOs
import { getPrintersByAreaQuery } from './queries/get-printers-by-area.query';
import { getPrinterByIdQuery } from './queries/get-printer-by-id.query';
import { getPrintersByUnitQuery } from './queries/get-printers-by-unit.query';
import { PrinterSummaryDto } from './dto/printer-summary.dto';

// New Stats Queries / DTOs
import { getPrinterHistoryQuery } from './queries/get-printer-history.query';
import { getPrinterYearlySummaryQuery } from './queries/get-printer-yearly-summary.query';
import { getPrinterComparisonQuery } from './queries/get-printer-comparison.query';
import { getUnitHistoryQuery } from './queries/get-unit-history.query';
import { PrinterHistoryDto } from './dto/printer-history.dto';
import { PrinterYearlySummaryDto } from './dto/printer-yearly-summary.dto';
import { PrinterComparisonDto } from './dto/printer-comparison.dto';
import { PrinterMonthlyStat } from './entities/printer-monthly-stat.entity';
import { Printer } from './entities/printer.entity';
import { PrinterTonerChange } from '../toners/entities/printer-toner-change.entity';

@Injectable()
export class PrintersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
    @InjectRepository(PrinterMonthlyStat)
    private readonly printerMonthlyStatRepository: Repository<PrinterMonthlyStat>,
  ) { }

  // ==========================================
  //  BASIC PRINTER METHODS
  // ==========================================

  async getPrintersByUserArea(areaId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const rows = await getPrintersByAreaQuery(supabase, areaId);
    if (!rows) return [];
    return rows.map(row => new PrinterSummaryDto(row));
  }

  async getPrintersByUnit(userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
    const supabase = this.supabaseService.getAdminClient();

    const rows = await getPrintersByUnitQuery(supabase, parseInt(userUnitId));
    if (!rows) return [];
    return rows.map(row => new PrinterSummaryDto(row));
  }

  async getPrinterById(printerId: string, userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
    const supabase = this.supabaseService.getAdminClient();
    const row = await getPrinterByIdQuery(supabase, printerId);
    if (!row) return null;

    const printerUnitId = row.unit_id;

    if (printerUnitId?.toString() !== userUnitId) {
      throw new ForbiddenException('Access to printer denied (Different Unit)');
    }
    return new PrinterSummaryDto(row);
  }

  // ==========================================
  //  OPERATIONAL STATUS
  // ==========================================

  async getOperationalStatus(userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    // Define "online" threshold: seen in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const totalCount = await this.printerRepository.count({
      where: { unitId: userUnitId }
    });

    // Instead of fighting createQueryBuilder mapping, we execute a raw filtered count
    const onlineCount = await this.printerRepository.createQueryBuilder("p")
      .where("p.unit_id = :unitId", { unitId: userUnitId })
      .andWhere("p.last_read_at >= :ago", { ago: tenMinutesAgo })
      .getCount();

    return {
      total: totalCount,
      online: onlineCount,
      offline: totalCount - onlineCount
    };
  }

  // ==========================================
  //  NEW STATISTICS METHODS
  // ==========================================

  private async validatePrinterAccess(printerId: string, userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
    const supabase = this.supabaseService.getAdminClient();
    // Reusing getPrinterByIdQuery to check ownership
    const row = await getPrinterByIdQuery(supabase, printerId);
    if (!row) throw new BadRequestException('Printer not found');

    const printerUnitId = row.unit_id;

    if (!userUnitId || printerUnitId?.toString() !== userUnitId) {
      throw new ForbiddenException('Access to printer denied (Different Unit)');
    }
    return { printerId, userUnitId };
  }

  async getPrinterHistory(
    printerId: string,
    userAreaId: string,
    filters: { startYear?: number; startMonth?: number; endYear?: number; endMonth?: number }
  ) {
    await this.validatePrinterAccess(printerId, userAreaId);

    const supabase = this.supabaseService.getAdminClient();
    const rows = await getPrinterHistoryQuery(supabase, {
      printerId,
      ...filters
    });

    return rows.map(row => new PrinterHistoryDto(row));
  }

  async getMonthlyStats(printerId: string, userAreaId: string) {
    await this.validatePrinterAccess(printerId, userAreaId);

    // Utilizamos QueryBuilder de TypeORM y delegamos el SUM/COUNT al motor PostgreSQL
    const rawData = await this.printerMonthlyStatRepository.createQueryBuilder('stats')
      .select('stats.year', 'year')
      .addSelect('stats.month', 'month')
      .addSelect('CAST(SUM(stats.print_total_delta) AS INTEGER)', 'totalImpressions')
      .addSelect((subQuery) => {
        return subQuery
          .select('CAST(COUNT(toner.id) AS INTEGER)', 'count')
          .from(PrinterTonerChange, 'toner')
          .where('toner.asset_id = stats.asset_id')
          .andWhere('EXTRACT(YEAR FROM toner.changed_at) = stats.year')
          .andWhere('EXTRACT(MONTH FROM toner.changed_at) = stats.month');
      }, 'tonerChanges')
      .where('stats.asset_id = :printerId', { printerId })
      .groupBy('stats.year')
      .addGroupBy('stats.month')
      .addGroupBy('stats.asset_id')
      .orderBy('stats.year', 'ASC')
      .addOrderBy('stats.month', 'ASC')
      .getRawMany();

    // Mapeo Type-Safe: Convertir cualquier string derivado del pg-node driver a number real
    return rawData.map(row => ({
      year: Number(row.year),
      month: Number(row.month),
      totalImpressions: Number(row.totalImpressions || 0),
      tonerChanges: Number(row.tonerChanges || 0)
    }));
  }

  async getPrinterYearlySummary(printerId: string, userAreaId: string, year: number) {
    await this.validatePrinterAccess(printerId, userAreaId);

    const supabase = this.supabaseService.getAdminClient();
    const rows = await getPrinterYearlySummaryQuery(supabase, printerId, year);

    return new PrinterYearlySummaryDto(year, rows);
  }

  async getPrinterComparison(printerId: string, userAreaId: string, months: number) {
    await this.validatePrinterAccess(printerId, userAreaId);

    const supabase = this.supabaseService.getAdminClient();
    const rows = await getPrinterComparisonQuery(supabase, printerId, months);

    return rows.map(row => new PrinterComparisonDto(row));
  }

  async getUnitHistory(userUnitId: string, months: number) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    // Now using TypeORM repository instead of Supabase client
    const rows = await getUnitHistoryQuery(this.printerMonthlyStatRepository, userUnitId, months);
    return rows;
  }

  async getUnitTonerStats(userUnitId: string, months: number = 12) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    const dateAgo = new Date();
    dateAgo.setMonth(dateAgo.getMonth() - (months - 1));
    dateAgo.setDate(1);
    dateAgo.setHours(0, 0, 0, 0);

    const rawData = await this.printerRepository.manager.createQueryBuilder(PrinterTonerChange, 'toner')
      .innerJoin('toner.printer', 'printer')
      .select('EXTRACT(YEAR FROM toner.changed_at)', 'year')
      .addSelect('EXTRACT(MONTH FROM toner.changed_at)', 'month')
      .addSelect('CAST(COUNT(toner.id) AS INTEGER)', 'changes')
      .where('printer.unit_id = :unitId', { unitId: userUnitId })
      .andWhere('toner.changed_at >= :date', { date: dateAgo })
      .groupBy('EXTRACT(YEAR FROM toner.changed_at)')
      .addGroupBy('EXTRACT(MONTH FROM toner.changed_at)')
      .orderBy('EXTRACT(YEAR FROM toner.changed_at)', 'ASC')
      .addOrderBy('EXTRACT(MONTH FROM toner.changed_at)', 'ASC')
      .getRawMany();

    return rawData.map(row => ({
      year: Number(row.year),
      month: Number(row.month),
      changes: Number(row.changes || 0),
    }));
  }
}
