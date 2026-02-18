import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    const supabase = this.supabaseService.getAdminClient();

    // Reuse query logic
    const rows = await getUnitHistoryQuery(supabase, userUnitId, months);
    return rows;
  }
}
