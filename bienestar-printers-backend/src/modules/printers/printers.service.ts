import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import * as xlsx from 'xlsx';

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
import { PrinterStatusLog } from './entities/printer-status-log.entity';
import { Alert } from './entities/alert.entity';

type ExcelCell = string | number | boolean | Date | null | undefined;
type ExcelRow = ExcelCell[];

@Injectable()
export class PrintersService {
  constructor(
    private readonly supabaseService: SupabaseService,
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
    const rows = await getPrintersByAreaQuery(this.printerRepository, areaId);
    if (!rows) return [];
    return rows.map((row) => new PrinterSummaryDto(row));
  }

  async getPrintersByUnit(userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    const rows = await getPrintersByUnitQuery(
      this.printerRepository,
      userUnitId,
    );
    if (!rows) return [];
    return rows.map((row) => new PrinterSummaryDto(row));
  }

  async getPrinterById(printerId: string, userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    const row = await getPrinterByIdQuery(this.printerRepository, printerId);
    if (!row) return null;

    const printerUnitId = row.unitId;

    if (printerUnitId?.toString() !== userUnitId) {
      throw new ForbiddenException('Access to printer denied (Different Unit)');
    }
    return new PrinterSummaryDto(row);
  }

  async registerManualTonerChange(printerId: string, userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    // Ensure user has access
    await this.getPrinterById(printerId, userUnitId);

    const change = this.tonerChangeRepository.create({
      assetId: printerId,
      changedAt: new Date(),
      detectionType: 'manual',
    });
    await this.tonerChangeRepository.save(change);
    return { success: true, message: 'Manual toner change registered' };
  }

  // ==========================================
  //  OPERATIONAL STATUS
  // ==========================================

  async getOperationalStatus(userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    // Define "online" threshold: seen in the last 20 minutes (since sweep is every 15m)
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    const totalCount = await this.printerRepository.count({
      where: { unitId: userUnitId },
    });

    // Instead of fighting createQueryBuilder mapping, we execute a raw filtered count
    const onlineCount = await this.printerRepository
      .createQueryBuilder('p')
      .where('p.unit_id = :unitId', { unitId: userUnitId })
      .andWhere('p.printer_status = :status', { status: 'online' })
      .andWhere('p.last_read_at >= :ago', { ago: twentyMinutesAgo })
      .getCount();

    return {
      total: totalCount,
      online: onlineCount,
      offline: totalCount - onlineCount,
    };
  }

  // ==========================================
  //  NEW STATISTICS METHODS
  // ==========================================

  async processExcelHistory(buffer: Buffer, year: number, month: number) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read raw 2D array for structural analysis
    const rawData: ExcelRow[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // 1. FIND HEADERS AND DETERMINE FORMAT
    let ipColIndex = -1;
    let headerRowIndex = -1;

    for (let i = 0; i < Math.min(rawData.length, 10); i++) {
      const row = rawData[i];
      if (!row) continue;
      const index = row.findIndex(
        (cell) => cell?.toString().trim().toLowerCase() === 'ip',
      );
      if (index !== -1) {
        ipColIndex = index;
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new BadRequestException(
        'No se encontró la columna "ip" en las primeras filas del archivo.',
      );
    }

    const headerRow = rawData[headerRowIndex];
    const prevRow = headerRowIndex > 0 ? rawData[headerRowIndex - 1] : [];
    const nextRow =
      headerRowIndex + 1 < rawData.length ? rawData[headerRowIndex + 1] : [];

    // 2. IDENTIFY MONTH GROUPS (WIDE FORMAT DETECTION)
    let monthGroups: {
      startCol: number;
      month: number;
      year: number;
    }[] = [];

    // Check for "wide" format: check current header row AND previous row for months
    const possibleRows = [prevRow, headerRow];
    for (const pRow of possibleRows) {
      if (!pRow) continue;
      for (let j = 0; j < pRow.length; j++) {
        const cell = pRow[j];
        if (cell !== undefined && cell !== null && cell !== '') {
          const parsed = this.parseMonthAndYear(cell);
          if (parsed) {
            if (!monthGroups.some((mg) => mg.startCol === j)) {
              monthGroups.push({
                startCol: j,
                month: parsed.month,
                year: parsed.year,
              });
            }
          }
        }
      }
    }

    // IMPORTANT: Sort groups chronologically to calculate deltas correctly between columns
    monthGroups = monthGroups.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    const results = {
      processed: 0,
      errors: [] as string[],
    };

    // 3. DETECT DATA START ROW
    let dataStartRow = headerRowIndex + 1;
    if (
      nextRow.some(
        (c) =>
          c?.toString().toLowerCase().includes('impresiones') ||
          c?.toString().toLowerCase().includes('mensual'),
      )
    ) {
      dataStartRow = headerRowIndex + 2;
    }

    // 4. PROCESS ROWS
    for (let i = dataStartRow; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !row[ipColIndex]) continue;

      const ipCell = row[ipColIndex];
      if (!ipCell) continue;
      const ip = ipCell.toString().trim();
      if (!ip || ip.toLowerCase() === 'ip' || ip.toLowerCase() === 'total')
        continue;

      const printer = await this.printerRepository.findOne({
        where: { ipPrinter: ip },
      });

      if (!printer) {
        if (ip.includes('.') || ip.length > 3) {
          results.errors.push(`IP ${ip} no encontrada en base de datos.`);
        }
        continue;
      }

      if (monthGroups.length > 0) {
        // --- WIDE FORMAT CASE ---
        // Cache for previous readings in the same row to calculate deltas between consecutive columns
        let prevReadings: any = null;

        for (const group of monthGroups) {
          const impresiones = Number(row[group.startCol]) || 0;
          const copia = Number(row[group.startCol + 1]) || 0;
          const total = Number(row[group.startCol + 2]) || 0;
          const mensual = Number(row[group.startCol + 3]) || 0;

          // Only process if there's any data
          if (total > 0 || impresiones > 0 || copia > 0 || mensual > 0) {
            prevReadings = await this.upsertStatWithCalculations(
              printer.assetId,
              group.year,
              group.month,
              {
                impresiones, // Meter reading
                copia, // Meter reading
                total, // Meter reading
                mensual, // Manual delta (fallback if no prev reading)
              },
              prevReadings, // Pass cache
            );
            results.processed++;
          }
        }
      } else {
        // --- LONG FORMAT CASE (EXPLICIT DATE REQUIRED) ---
        // Look for values in the current row based on flat headers
        let rowYear: number | null = null;
        let rowMonth: number | null = null;

        // Map column names to indices for this row
        const rowDataMap: Record<string, any> = {};
        headerRow.forEach((h, idx) => {
          if (h) rowDataMap[h.toString().toLowerCase()] = row[idx];
        });

        const mesVal =
          rowDataMap['mes'] || rowDataMap['month'] || rowDataMap['pasa_mes'];
        const anioVal =
          rowDataMap['año'] || rowDataMap['anio'] || rowDataMap['year'];

        if (mesVal) {
          const m = this.parseMonthName(mesVal.toString());
          if (m) rowMonth = m;
        }
        if (anioVal) {
          const y = parseInt(anioVal.toString());
          if (!isNaN(y)) rowYear = y;
        }

        // ONLY save if year and month were explicitly found in the row
        if (rowYear && rowMonth) {
          const impresiones = Number(rowDataMap['impresiones']) || 0;
          const copia = Number(rowDataMap['copia']) || 0;
          const total = Number(rowDataMap['total']) || 0;
          const mensual = Number(rowDataMap['mensual']) || 0;

          if (mensual > 0 || total > 0 || impresiones > 0 || copia > 0) {
            await this.upsertStat(printer.assetId, rowYear, rowMonth, {
              impresiones,
              copia,
              total,
              mensual,
            });
            results.processed++;
          }
        } else {
          results.errors.push(
            `Fila para IP ${ip} omitida: No se encontró Mes/Año en el archivo.`,
          );
        }
      }
    }

    return results;
  }

  private async upsertStatWithCalculations(
    assetId: string,
    year: number,
    month: number,
    data: {
      impresiones: number;
      copia: number;
      total: number;
      mensual: number;
    },
    prevReadingsCache?: PrinterMonthlyStat | null,
  ) {
    // 1. Get or create current record
    let stat = await this.printerMonthlyStatRepository.findOne({
      where: { assetId, year, month },
    });

    if (!stat) {
      stat = this.printerMonthlyStatRepository.create({
        assetId,
        year,
        month,
      });
    }

    let prev: PrinterMonthlyStat | null = prevReadingsCache ?? null;
    if (!prev) {
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
      }
      prev = await this.printerMonthlyStatRepository.findOne({
        where: { assetId, year: prevYear, month: prevMonth },
      });
    }

    // 3. Calculate Deltas (Usage)
    if (prev && Number(prev.printTotalReading) > 0) {
      // Standard Case: Substract previous meter from current meter
      const totalDelta = data.total - Number(prev.printTotalReading);
      const printDelta = data.impresiones - Number(prev.printOnlyReading);
      const copyDelta = data.copia - Number(prev.copyReading);

      // Save deltas (ensure they are non-negative, or fallback to manual 'mensual' if reset)
      const pDelta = printDelta >= 0 ? printDelta : 0;
      const cDelta = copyDelta >= 0 ? copyDelta : 0;

      // Total should be at least the sum of components
      const tDelta = Math.max(
        totalDelta >= 0 ? totalDelta : data.mensual || 0,
        pDelta + cDelta,
      );

      stat.printTotalDelta = tDelta.toString();
      stat.printOnlyDelta = pDelta.toString();
      stat.copyDelta = cDelta.toString();
    } else {
      // First record/No previous: Use 'mensual' as delta if provided
      stat.printTotalDelta = (data.mensual || 0).toString();

      // Heuristic for breakdown if only total delta provided:
      // Proportion of current readings
      if (data.total > 0 && data.mensual > 0) {
        const ratioP = data.impresiones / data.total;
        const ratioC = data.copia / data.total;
        stat.printOnlyDelta = Math.round(data.mensual * ratioP).toString();
        stat.copyDelta = Math.round(data.mensual * ratioC).toString();
      } else if (data.mensual > 0) {
        // Assume all are prints if no readings provided but delta exists
        stat.printOnlyDelta = data.mensual.toString();
        stat.copyDelta = '0';
      } else {
        stat.printOnlyDelta = '0';
        stat.copyDelta = '0';
      }
    }

    // 4. Update Readings (Counters)
    stat.printTotalReading = data.total.toString();
    stat.printOnlyReading = data.impresiones.toString();
    stat.copyReading = data.copia.toString();

    return await this.printerMonthlyStatRepository.save(stat);
  }

  private async upsertStat(
    assetId: string,
    year: number,
    month: number,
    data: {
      impresiones: number;
      copia: number;
      total: number;
      mensual: number;
    },
  ) {
    // Legacy method for single-row/non-calculated uploads (if any)
    return this.upsertStatWithCalculations(assetId, year, month, data);
  }

  private parseMonthAndYear(
    cell: unknown,
  ): { month: number; year: number } | null {
    if (!cell) return null;

    // Handle Excel Date objects (xlsx often returns them as Date objects or formatted strings)
    if (cell instanceof Date) {
      return {
        month: cell.getMonth() + 1,
        year: cell.getFullYear(),
      };
    }

    const text = cell.toString().trim().toLowerCase();

    // Flexible regex for "ene-25", "enero 2025", "ene/25", "1-2025", etc.
    // Group 1: Month name or number
    // Group 2: Separator
    // Group 3: Year (2 or 4 digits)
    const match = text.match(/^([a-zñ0-9]{1,10})[-/\s]+(\d{2,4})$/);

    if (match) {
      const monthPart = match[1];
      const yearPart = match[2];

      let month = this.parseMonthName(monthPart);
      if (!month) {
        const mNum = parseInt(monthPart);
        if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) month = mNum;
      }

      let year = parseInt(yearPart);
      if (year < 100) year += 2000;

      if (month && year) {
        return { month, year };
      }
    }

    return null;
  }

  async getExcelTemplate(year: number, userUnitId: string): Promise<Buffer> {
    const printers = await this.printerRepository.find({
      where: { unitId: userUnitId },
      order: { namePrinter: 'ASC' },
    });

    const monthShortNames = [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];

    const yearSuffix = year.toString().slice(-2);

    // Row 0: Month Headers (ene-25, etc.)
    const row0: ExcelRow = ['ip'];
    // Row 1: Sub-headers (impresiones, copia, total, mensual)
    const row1: ExcelRow = [''];

    const merges: xlsx.Range[] = [];

    monthShortNames.forEach((m, i) => {
      const monthLabel = `${m}-${yearSuffix}`;
      row0.push(monthLabel, null, null, null);
      row1.push('impresiones', 'copia', 'total', 'mensual');

      // Merge columns for this month: from (i*4 + 1) to (i*4 + 4)
      merges.push({
        s: { r: 0, c: i * 4 + 1 },
        e: { r: 0, c: i * 4 + 4 },
      });
    });

    const data: ExcelRow[] = [row0, row1];

    // Add Printer Rows
    printers.forEach((p) => {
      const row: ExcelRow = [p.ipPrinter];
      // Fill with zeros for each month
      for (let i = 0; i < 12 * 4; i++) row.push(0);
      data.push(row);
    });

    const ws = xlsx.utils.aoa_to_sheet(data);
    ws['!merges'] = merges;

    // Set column widths
    ws['!cols'] = [{ wch: 15 }]; // IP column
    for (let i = 0; i < 12 * 4; i++) {
      ws['!cols'].push({ wch: 10 });
    }

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, `SMIAB-${year}`);

    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  private parseMonthName(name: string): number | null {
    const months: Record<string, number> = {
      enero: 1,
      ene: 1,
      january: 1,
      jan: 1,
      febrero: 2,
      feb: 2,
      february: 2,
      marzo: 3,
      mar: 3,
      march: 3,
      abril: 4,
      abr: 4,
      april: 4,
      apr: 4,
      mayo: 5,
      may: 5,
      junio: 6,
      jun: 6,
      june: 6,
      julio: 7,
      jul: 7,
      july: 7,
      agosto: 8,
      ago: 8,
      august: 8,
      aug: 8,
      septiembre: 9,
      sep: 9,
      september: 9,
      octubre: 10,
      oct: 10,
      october: 10,
      noviembre: 11,
      nov: 11,
      november: 11,
      diciembre: 12,
      dic: 12,
      december: 12,
      dec: 12,
    };

    const cleanName = name.trim().toLowerCase();
    // Try direct number first
    const num = parseInt(cleanName);
    if (!isNaN(num) && num >= 1 && num <= 12) return num;

    return months[cleanName] || null;
  }

  private async validatePrinterAccess(printerId: string, userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    // Reusing getPrinterByIdQuery to check ownership
    const row = await getPrinterByIdQuery(this.printerRepository, printerId);
    if (!row) throw new BadRequestException('Printer not found');

    const printerUnitId = row.unitId;

    if (!userUnitId || printerUnitId?.toString() !== userUnitId) {
      throw new ForbiddenException('Access to printer denied (Different Unit)');
    }
    return { printerId, userUnitId };
  }

  async getPrinterHistory(
    printerId: string,
    userAreaId: string,
    filters: {
      startYear?: number;
      startMonth?: number;
      endYear?: number;
      endMonth?: number;
    },
  ) {
    await this.validatePrinterAccess(printerId, userAreaId);

    const rows = await getPrinterHistoryQuery(
      this.printerMonthlyStatRepository,
      {
        printerId,
        ...filters,
      },
    );

    return rows.map((row) => new PrinterHistoryDto(row));
  }

  async getMonthlyStats(printerId: string, userAreaId: string) {
    await this.validatePrinterAccess(printerId, userAreaId);

    // Utilizamos QueryBuilder de TypeORM y delegamos el SUM/COUNT al motor PostgreSQL
    const rawData = await this.printerMonthlyStatRepository
      .createQueryBuilder('stats')
      .select('stats.year', 'year')
      .addSelect('stats.month', 'month')
      .addSelect(
        'CAST(SUM(stats.print_total_delta) AS INTEGER)',
        'totalImpressions',
      )
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
      .groupBy('stats.year')
      .addGroupBy('stats.month')
      .addGroupBy('stats.asset_id')
      .orderBy('stats.year', 'ASC')
      .addOrderBy('stats.month', 'ASC')
      .getRawMany();

    // Mapeo Type-Safe: Convertir cualquier string derivado del pg-node driver a number real
    return rawData.map((row) => ({
      year: Number(row.year),
      month: Number(row.month),
      totalImpressions: Number(row.totalImpressions || 0),
      printOnly: Number(row.printOnly || 0),
      copies: Number(row.copies || 0),
      tonerChanges: Number(row.tonerChanges || 0),
    }));
  }

  async getPrinterYearlySummary(
    printerId: string,
    userAreaId: string,
    year: number,
  ) {
    await this.validatePrinterAccess(printerId, userAreaId);

    const rows = await getPrinterYearlySummaryQuery(
      this.printerMonthlyStatRepository,
      printerId,
      year,
    );

    return new PrinterYearlySummaryDto(year, rows);
  }

  async getPrinterComparison(
    printerId: string,
    userAreaId: string,
    months: number,
  ) {
    await this.validatePrinterAccess(printerId, userAreaId);

    const rows = await getPrinterComparisonQuery(
      this.printerMonthlyStatRepository,
      printerId,
      months,
    );

    return rows.map((row) => new PrinterComparisonDto(row));
  }

  async getUnitHistory(userUnitId: string, year: number, month: number) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    // Now using TypeORM repository instead of Supabase client
    const rows = await getUnitHistoryQuery(
      this.printerMonthlyStatRepository,
      userUnitId,
      year,
      month,
    );
    return rows;
  }

  async getUnitTonerStats(userUnitId: string, year: number, month: number) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    const rawData = await this.printerRepository.manager
      .createQueryBuilder(PrinterTonerChange, 'toner')
      .innerJoin('toner.printer', 'printer')
      .select('EXTRACT(YEAR FROM toner.changed_at)', 'year')
      .addSelect('EXTRACT(MONTH FROM toner.changed_at)', 'month')
      .addSelect('CAST(COUNT(toner.id) AS INTEGER)', 'changes')
      .where('printer.unit_id = :unitId', { unitId: userUnitId })
      .andWhere('EXTRACT(YEAR FROM toner.changed_at) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM toner.changed_at) <= :month', { month })
      .groupBy('EXTRACT(YEAR FROM toner.changed_at)')
      .addGroupBy('EXTRACT(MONTH FROM toner.changed_at)')
      .orderBy('EXTRACT(YEAR FROM toner.changed_at)', 'ASC')
      .addOrderBy('EXTRACT(MONTH FROM toner.changed_at)', 'ASC')
      .getRawMany();

    return rawData.map((row) => ({
      year: Number(row.year),
      month: Number(row.month),
      changes: Number(row.changes || 0),
    }));
  }

  async getUnitTopPrintConsumers(
    userUnitId: string,
    year: number,
    month: number,
  ) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    const rawData = await this.printerMonthlyStatRepository
      .createQueryBuilder('stats')
      .innerJoin('stats.printer', 'printer')
      .select('printer.assetId', 'printerId')
      .addSelect('printer.namePrinter', 'name')
      .addSelect(
        'CAST(SUM(stats.print_total_delta) AS INTEGER)',
        'totalImpressions',
      )
      .where('printer.unitId = :unitId', { unitId: userUnitId })
      .andWhere('stats.year = :year', { year })
      .andWhere('stats.month = :month', { month })
      .groupBy('printer.assetId')
      .addGroupBy('printer.namePrinter')
      .orderBy('CAST(SUM(stats.print_total_delta) AS INTEGER)', 'DESC')
      .getRawMany();

    return rawData.map((row) => ({
      printerId: row.printerId,
      name: row.name,
      totalImpressions: Number(row.totalImpressions || 0),
    }));
  }

  async getTonerHistory(printerId: string, userAreaId: string) {
    await this.validatePrinterAccess(printerId, userAreaId);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const logs = await this.printerStatusLogRepository.find({
      where: {
        printerId: printerId,
        recordedAt: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: {
        recordedAt: 'ASC',
      },
    });

    return logs.map((log) => ({
      date: log.recordedAt.toISOString().split('T')[0], // YYYY-MM-DD
      time: log.recordedAt.toISOString().split('T')[1].substring(0, 5), // HH:mm
      tonerLevel: log.tonerLevel,
    }));
  }

  // ==========================================
  //  ALERTS
  // ==========================================

  async getActiveAlerts(printerId: string, userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
    await this.validatePrinterAccess(printerId, userUnitId);

    const alerts = await this.alertRepository.find({
      where: {
        printerId,
        status: 'PENDING',
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return alerts;
  }

  async resolveAlert(alertId: string, userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
      relations: ['printer'],
    });

    if (!alert) {
      throw new BadRequestException('Alert not found');
    }

    // Verify user has access to the printer this alert belongs to
    await this.validatePrinterAccess(alert.printerId, userUnitId);

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date();
    await this.alertRepository.save(alert);

    return { success: true, message: 'Alert resolved successfully' };
  }
}
