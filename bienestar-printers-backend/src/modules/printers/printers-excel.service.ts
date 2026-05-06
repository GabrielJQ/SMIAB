import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { Printer } from './entities/printer.entity';
import { PrinterMonthlyStat } from './entities/printer-monthly-stat.entity';

/**
 * @description Define los tipos de datos permitidos en una celda de Excel histórica.
 */
export type ExcelCell = string | number | boolean | Date | null | undefined;

/**
 * @description Estructura de fila representando un arreglo de celdas.
 */
export type ExcelRow = ExcelCell[];

/**
 * @class PrintersExcelService
 * @description Motor especializado en la ingesta y exportación de datos mediante Excel.
 * Implementa la lógica de detección de formatos y cálculo de deltas históricos.
 */
@Injectable()
export class PrintersExcelService {
  private readonly logger = new Logger(PrintersExcelService.name);

  constructor(
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
    @InjectRepository(PrinterMonthlyStat)
    private readonly printerMonthlyStatRepository: Repository<PrinterMonthlyStat>,
  ) {}

  /**
   * @method processExcelHistory
   * @description Procesa un archivo Excel para cargar historial de impresiones.
   */
  async processExcelHistory(buffer: Buffer, year: number, month: number) {
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData: ExcelRow[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

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
      throw new BadRequestException('No se encontró la columna "ip" en el archivo.');
    }

    const headerRow = rawData[headerRowIndex];
    const prevRow = headerRowIndex > 0 ? rawData[headerRowIndex - 1] : [];
    const nextRow = headerRowIndex + 1 < rawData.length ? rawData[headerRowIndex + 1] : [];

    let monthGroups: { startCol: number; month: number; year: number }[] = [];

    const possibleRows = [prevRow, headerRow];
    for (const pRow of possibleRows) {
      if (!pRow) continue;
      for (let j = 0; j < pRow.length; j++) {
        const cell = pRow[j];
        if (cell !== undefined && cell !== null && cell !== '') {
          const parsed = this.parseMonthAndYear(cell);
          if (parsed) {
            if (!monthGroups.some((mg) => mg.startCol === j)) {
              monthGroups.push({ startCol: j, month: parsed.month, year: parsed.year });
            }
          }
        }
      }
    }

    monthGroups = monthGroups.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));

    const results = { processed: 0, errors: [] as string[] };
    let dataStartRow = headerRowIndex + 1;
    if (nextRow.some((c) => c?.toString().toLowerCase().includes('impresiones') || c?.toString().toLowerCase().includes('mensual'))) {
      dataStartRow = headerRowIndex + 2;
    }

    for (let i = dataStartRow; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || !row[ipColIndex]) continue;

      const ipCell = row[ipColIndex];
      if (!ipCell) continue;
      const ip = ipCell.toString().trim();
      if (!ip || ip.toLowerCase() === 'ip' || ip.toLowerCase() === 'total') continue;

      const printer = await this.printerRepository.findOne({ where: { ipPrinter: ip } });
      if (!printer) {
        if (ip.includes('.') || ip.length > 3) results.errors.push(`IP ${ip} no encontrada.`);
        continue;
      }

      if (monthGroups.length > 0) {
        let prevReadings: any = null;
        for (const group of monthGroups) {
          const impresiones = Number(row[group.startCol]) || 0;
          const copia = Number(row[group.startCol + 1]) || 0;
          const total = Number(row[group.startCol + 2]) || 0;
          const mensual = Number(row[group.startCol + 3]) || 0;

          if (total > 0 || impresiones > 0 || copia > 0 || mensual > 0) {
            prevReadings = await this.upsertStatWithCalculations(printer.assetId, group.year, group.month, {
              impresiones, copia, total, mensual
            }, prevReadings);
            results.processed++;
          }
        }
      } else {
        // Lógica Long Format
        const rowDataMap: Record<string, any> = {};
        headerRow.forEach((h, idx) => { if (h) rowDataMap[h.toString().toLowerCase()] = row[idx]; });

        const rowMonth = rowDataMap['mes'] || rowDataMap['month'] || rowDataMap['pasa_mes'] ? this.parseMonthName((rowDataMap['mes'] || rowDataMap['month'] || rowDataMap['pasa_mes']).toString()) : null;
        const rowYear = parseInt(rowDataMap['año'] || rowDataMap['anio'] || rowDataMap['year']);

        if (rowYear && rowMonth) {
          await this.upsertStatWithCalculations(printer.assetId, rowYear, rowMonth, {
            impresiones: Number(rowDataMap['impresiones']) || 0,
            copia: Number(rowDataMap['copia']) || 0,
            total: Number(rowDataMap['total']) || 0,
            mensual: Number(rowDataMap['mensual']) || 0,
          });
          results.processed++;
        }
      }
    }
    return results;
  }

  /**
   * @method getExcelTemplate
   * @description Genera un Buffer con la plantilla de Excel para carga masiva.
   */
  async getExcelTemplate(year: number, userUnitId: string): Promise<Buffer> {
    const printers = await this.printerRepository.find({
      where: { unitId: userUnitId },
      order: { namePrinter: 'ASC' },
    });

    const monthShortNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const yearSuffix = year.toString().slice(-2);
    const row0: ExcelRow = ['ip'];
    const row1: ExcelRow = [''];
    const merges: xlsx.Range[] = [];

    monthShortNames.forEach((m, i) => {
      row0.push(`${m}-${yearSuffix}`, null, null, null);
      row1.push('impresiones', 'copia', 'total', 'mensual');
      merges.push({ s: { r: 0, c: i * 4 + 1 }, e: { r: 0, c: i * 4 + 4 } });
    });

    const data: ExcelRow[] = [row0, row1];
    printers.forEach((p) => {
      const row: ExcelRow = [p.ipPrinter];
      for (let i = 0; i < 12 * 4; i++) row.push(0);
      data.push(row);
    });

    const ws = xlsx.utils.aoa_to_sheet(data);
    ws['!merges'] = merges;
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, `SMIAB-${year}`);
    return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  // --- PRIVATE UTILS (MIGRATED FROM CORE) ---

  private async upsertStatWithCalculations(
    assetId: string,
    year: number,
    month: number,
    data: { impresiones: number; copia: number; total: number; mensual: number },
    prevReadingsCache?: PrinterMonthlyStat | null,
  ) {
    let stat = await this.printerMonthlyStatRepository.findOne({ where: { assetId, year, month } });
    if (!stat) {
      stat = this.printerMonthlyStatRepository.create({ assetId, year, month });
    }

    let prev = prevReadingsCache || null;
    if (!prev) {
      // Búsqueda del registro más reciente anterior al periodo actual
      prev = await this.printerMonthlyStatRepository.createQueryBuilder('s')
        .where('s.asset_id = :assetId', { assetId })
        .andWhere('(s.year < :year OR (s.year = :year AND s.month < :month))', { year, month })
        .orderBy('s.year', 'DESC')
        .addOrderBy('s.month', 'DESC')
        .getOne();
    }

    if (prev && Number(prev.printTotalReading) > 0) {
      const prevTotal = Number(prev.printTotalReading);
      const prevOnly = Number(prev.printOnlyReading);
      const prevCopy = Number(prev.copyReading);

      let pDelta = data.impresiones - prevOnly;
      let cDelta = data.copia - prevCopy;
      let tDelta = data.total - prevTotal;

      // DETECCIÓN DE RESETEO (Hardware Reset / Printer Swap)
      if (tDelta < 0) {
        this.logger.warn(`Reseteo detectado en IP/Activo ${assetId} en ${month}/${year}. Contador bajó de ${prevTotal} a ${data.total}`);
        // Si el Excel no trae delta mensual, el delta es el total actual (empezó de 0)
        tDelta = data.mensual || data.total;
        pDelta = data.impresiones;
        cDelta = data.copia;
      }

      // Evitar picos irreales por meses faltantes (Fila 7)
      // Si el delta calculado es sospechosamente igual al total y el Excel trae un mensual coherente, usamos el menor
      if (data.mensual > 0 && data.mensual < tDelta) {
        tDelta = data.mensual;
      }

      stat.printTotalDelta = Math.max(0, tDelta).toString();
      stat.printOnlyDelta = Math.max(0, pDelta).toString();
      stat.copyDelta = Math.max(0, cDelta).toString();
    } else {
      // Sin registros previos: Confiamos en el mensual del Excel o en el Total
      const tDelta = data.mensual || data.total;
      stat.printTotalDelta = tDelta.toString();
      
      if (data.total > 0) {
        const ratio = data.impresiones / data.total;
        stat.printOnlyDelta = Math.round(tDelta * ratio).toString();
        stat.copyDelta = (tDelta - Number(stat.printOnlyDelta)).toString();
      } else {
        stat.printOnlyDelta = tDelta.toString();
        stat.copyDelta = '0';
      }
    }

    stat.printTotalReading = data.total.toString();
    stat.printOnlyReading = data.impresiones.toString();
    stat.copyReading = data.copia.toString();

    return await this.printerMonthlyStatRepository.save(stat);
  }

  private parseMonthAndYear(cell: unknown): { month: number; year: number } | null {
    if (!cell) return null;
    
    // Si xlsx ya lo convirtió a Date
    if (cell instanceof Date) {
      return { month: cell.getUTCMonth() + 1, year: cell.getUTCFullYear() };
    }

    // Si es un número (serial date) pero no se convirtió a Date
    if (typeof cell === 'number' && cell > 40000) {
      const date = xlsx.utils.format_cell({ v: cell, t: 'd' }); // Intento de formateo
      const d = new Date(date);
      if (!isNaN(d.getTime())) return { month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
    }

    const text = cell.toString().trim().toLowerCase();
    const match = text.match(/^([a-zñ0-9]{1,10})[-/\s]+(\d{2,4})$/);
    if (match) {
      const month = this.parseMonthName(match[1]) || (parseInt(match[1]) >= 1 && parseInt(match[1]) <= 12 ? parseInt(match[1]) : null);
      let year = parseInt(match[2]);
      if (year < 100) year += 2000;
      if (month && year) return { month, year };
    }
    return null;
  }

  private parseMonthName(name: string): number | null {
    const months: Record<string, number> = {
      enero: 1, ene: 1, january: 1, jan: 1, febrero: 2, feb: 2, february: 2, marzo: 3, mar: 3, march: 3,
      abril: 4, abr: 4, april: 4, apr: 4, mayo: 5, may: 5, junio: 6, jun: 6, june: 6, julio: 7, jul: 7, july: 7,
      agosto: 8, ago: 8, august: 8, aug: 8, septiembre: 9, sep: 9, september: 9, octubre: 10, oct: 10, october: 10,
      noviembre: 11, nov: 11, november: 11, diciembre: 12, dic: 12, december: 12, dec: 12,
    };
    return months[name.trim().toLowerCase()] || null;
  }
}
