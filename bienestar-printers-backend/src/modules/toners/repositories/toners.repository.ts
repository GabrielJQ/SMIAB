import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from '../../../integrations/supabase/supabase.service';
import { PrinterTonerChange } from '../entities/printer-toner-change.entity';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  applyTimestampRangeFilter,
  DateRangeFilter,
} from '../../../common/utils/supabase-query-helpers';

@Injectable()
export class TonersRepository {
  constructor(
    private readonly supabase: SupabaseService,
    @InjectRepository(PrinterTonerChange)
    private readonly repo: Repository<PrinterTonerChange>,
  ) {}

  async getPrinterTonerHistoryQuery(printerId: string, year: number, month: number, ) {
  // 1. Generate the strict list of months we want to show (Jan to selected month)
  const monthsList: { year: number; month: number }[] = [];
  for (let m = 1; m <= month; m++) {
    monthsList.push({ year, month: m });
  }

  // Step 2: Use QueryBuilder to fetch grouped results from DB directly
  const results = await this.repo
    .createQueryBuilder('change')
    .select('EXTRACT(YEAR FROM change.changedAt)', 'year') // Use Postgres EXTRACT function
    .addSelect('EXTRACT(MONTH FROM change.changedAt)', 'month')
    .addSelect('COUNT(change.id)', 'toner_count')
    .where('change.assetId = :printerId', { printerId })
    .andWhere('EXTRACT(YEAR FROM change.changedAt) = :year', { year })
    .andWhere('EXTRACT(MONTH FROM change.changedAt) <= :month', { month })
    .groupBy('EXTRACT(YEAR FROM change.changedAt)')
    .addGroupBy('EXTRACT(MONTH FROM change.changedAt)')
    .getRawMany();

  const resultMap = new Map<string, number>();

  results.forEach((row) => {
    // results from EXTRACT might be returned as string or number depending on the pg driver version
    const y = Number(row.year);
    const m = Number(row.month);
    resultMap.set(`${y}-${m}`, Number(row.toner_count));
  });

  // Step 3: Map strictly to our months list
  return monthsList.map((item) => {
    const key = `${item.year}-${item.month}`;
    return {
      year: item.year,
      month: item.month,
      toner_count: resultMap.get(key) || 0,
    };
  });
}

  async getTonerHistoryByPrinterQuery(printerId: string, params: DateRangeFilter, ) {
  const supabase = this.supabase.getAdminClient();
  let query = supabase
    .from('printer_toner_changes')
    .select('*')
    .eq('asset_id', printerId);

  query = applyTimestampRangeFilter(query, 'changed_at', params);

  query = query.order('changed_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}

  async getTonerHistoryByUnitQuery(unitId: string, limit: number = 50, ) {
  const supabase = this.supabase.getAdminClient();
  // We need to join via printers -> areas -> units
  // supabase-js syntax for deep joins:
  const { data, error } = await supabase
    .from('printer_toner_changes')
    .select(
      `
      *,
      printers!inner (
        asset_id,
        name_printer,
        unit_id
      )
    `,
    )
    .eq('printers.unit_id', unitId)
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

  async getTonerHistoryMonthlyQuery(unitId: string, months: number = 6, ) {
  // Logic: Get changes in the last N months for the entire unit.
  // We can't easily "group by" in Supabase JS client and return custom objects without using a view or RPC.
  // Given constraints ("NO modificar autenticación", "NO meter lógica en queries"),
  // and Phase 0/Simple requirements, I will fetch the raw data within the range and let the Service aggregate.

  // However, the prompt says "Queries requeridos... Agrupación mensual".
  // If I can't do it in SQL via Client easily, I'll return the raw rows sorted.
  // Service will map them to the Summary DTO if needed, or Controller will.

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1); // Start of that month

  const supabase = this.supabase.getAdminClient();
  const { data, error } = await supabase
    .from('printer_toner_changes')
    .select(
      `
      *,
      printers!inner (
        asset_id,
        name_printer,
        unit_id
      )
    `,
    )
    .eq('printers.unit_id', unitId)
    .gte('changed_at', startDate.toISOString())
    .order('changed_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

  async getUnitTonerHistoryQuery(unitId: string, year: number, month: number, ) {
  // 1. Generate the strict list of months we want to show (Jan to selected month)
  const monthsList: { year: number; month: number }[] = [];
  for (let m = 1; m <= month; m++) {
    monthsList.push({ year, month: m });
  }

  // Step 2: Use QueryBuilder to fetch grouped results from DB directly
  const results = await this.repo
    .createQueryBuilder('change')
    .select('EXTRACT(YEAR FROM change.changedAt)', 'year') // Use Postgres EXTRACT function
    .addSelect('EXTRACT(MONTH FROM change.changedAt)', 'month')
    .addSelect('COUNT(change.id)', 'toner_count')
    .innerJoin('change.printer', 'printer')
    .where('printer.unitId = :unitId', { unitId })
    .andWhere('EXTRACT(YEAR FROM change.changedAt) = :year', { year })
    .andWhere('EXTRACT(MONTH FROM change.changedAt) <= :month', { month })
    .groupBy('EXTRACT(YEAR FROM change.changedAt)')
    .addGroupBy('EXTRACT(MONTH FROM change.changedAt)')
    .getRawMany();

  // The database gives us only the months that had changes.
  // We need to merge this with our strict monthsList to ensure every month is reported (with 0 if no changes).
  const resultMap = new Map<string, number>();

  results.forEach((row) => {
    // results from EXTRACT might be returned as string or number depending on the pg driver version
    const y = Number(row.year);
    const m = Number(row.month);
    resultMap.set(`${y}-${m}`, Number(row.toner_count));
  });

  // Step 3: Map strictly to our months list
  return monthsList.map((item) => {
    const key = `${item.year}-${item.month}`;
    return {
      year: item.year,
      month: item.month,
      toner_count: resultMap.get(key) || 0,
    };
  });
}

  async getUnitTopConsumersQuery(unitId: string, year?: number, month?: number, ) {
  const today = new Date();
  const targetYear = year || today.getFullYear();
  // If month is provided use it (1-12), else use current month
  const targetMonth = month || today.getMonth() + 1;

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 1);

  // We use getRawMany to safely extract all fields avoiding complex entity nesting issues
  const rawChanges = await this.repo
    .createQueryBuilder('change')
    .select('printer.assetId', 'assetId')
    .addSelect('printer.namePrinter', 'printerName')
    .addSelect('department.areanom', 'areaName')
    .addSelect('change.changedAt', 'changedAt')
    .addSelect('change.detectionType', 'detectionType')
    .innerJoin('change.printer', 'printer')
    .leftJoin('printer.department', 'department')
    .where('printer.unitId = :unitId', { unitId })
    .andWhere('change.changedAt >= :startDate', { startDate })
    .andWhere('change.changedAt < :endDate', { endDate })
    .orderBy('change.changedAt', 'DESC')
    .getRawMany();

  // Group by printer
  const grouped = new Map<
    string,
    {
      assetId: string;
      printerName: string;
      areaName: string;
      toner_count: number;
      events: { date: Date; type: string }[];
    }
  >();

  for (const row of rawChanges) {
    const assetId = row.assetId;
    if (!grouped.has(assetId)) {
      grouped.set(assetId, {
        assetId: assetId,
        printerName: row.printerName,
        areaName: row.areaName || 'Área no asignada',
        toner_count: 0,
        events: [],
      });
    }
    const group = grouped.get(assetId)!;
    group.toner_count++;
    group.events.push({
      date: row.changedAt,
      type: row.detectionType,
    });
  }

  // Sort by count DESC and take top 10
  const results = Array.from(grouped.values())
    .sort((a, b) => b.toner_count - a.toner_count)
    .slice(0, 10);

  return results;
}
}
