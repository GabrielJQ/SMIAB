import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

// Basic Queries / DTOs
import { getPrintersByAreaQuery } from './queries/get-printers-by-area.query';
import { getPrinterByIdQuery } from './queries/get-printer-by-id.query';
import { getPrintersByUnitQuery } from './queries/get-printers-by-unit.query';
import { getUnitByAreaQuery } from './queries/get-unit-by-area.query';
import { PrinterSummaryDto } from './dto/printer-summary.dto';

// New Stats Queries / DTOs
import { getPrinterHistoryQuery } from './queries/get-printer-history.query';
import { getPrinterYearlySummaryQuery } from './queries/get-printer-yearly-summary.query';
import { getPrinterComparisonQuery } from './queries/get-printer-comparison.query';
import { getUnitHistoryQuery } from './queries/get-unit-history.query';
import { PrinterHistoryDto } from './dto/printer-history.dto';
import { PrinterYearlySummaryDto } from './dto/printer-yearly-summary.dto';
import { PrinterComparisonDto } from './dto/printer-comparison.dto';

@Injectable()
export class PrintersService {
  constructor(
    private readonly supabaseService: SupabaseService,
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

  async getPrintersByUnit(userAreaId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const unitId = await getUnitByAreaQuery(supabase, userAreaId);
    if (!unitId) throw new ForbiddenException('User area has no unit assigned');

    const rows = await getPrintersByUnitQuery(supabase, unitId);
    if (!rows) return [];
    return rows.map(row => new PrinterSummaryDto(row));
  }

  async getPrinterById(printerId: string, userAreaId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const row = await getPrinterByIdQuery(supabase, printerId);
    if (!row) return null;

    const userUnitId = await getUnitByAreaQuery(supabase, userAreaId);
    if (!userUnitId) throw new ForbiddenException('User area has no unit assigned');

    const area = Array.isArray(row.areas) ? row.areas[0] : row.areas;
    const printerUnitId = area?.unit_id;

    if (printerUnitId !== userUnitId) {
      throw new ForbiddenException('Access to printer denied (Different Unit)');
    }
    return new PrinterSummaryDto(row);
  }

  // ==========================================
  //  NEW STATISTICS METHODS
  // ==========================================

  private async validatePrinterAccess(printerId: string, userAreaId: string) {
    const supabase = this.supabaseService.getAdminClient();
    // Reusing getPrinterByIdQuery to check ownership
    const row = await getPrinterByIdQuery(supabase, printerId);
    if (!row) throw new BadRequestException('Printer not found');

    const userUnitId = await getUnitByAreaQuery(supabase, userAreaId);
    const area = Array.isArray(row.areas) ? row.areas[0] : row.areas;
    const printerUnitId = area?.unit_id;

    if (!userUnitId || printerUnitId !== userUnitId) {
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

  async getUnitHistory(userAreaId: string, months: number) {
    const supabase = this.supabaseService.getAdminClient();
    const unitId = await getUnitByAreaQuery(supabase, userAreaId);
    if (!unitId) throw new ForbiddenException('User area has no unit assigned');

    // Reuse query logic
    const rows = await getUnitHistoryQuery(supabase, unitId, months);
    return rows;
  }
}
