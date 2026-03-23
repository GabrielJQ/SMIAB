import { ApiProperty } from '@nestjs/swagger';
import { PrinterMonthlyStats } from '../types/printer-monthly-stats.type';

/**
 * @class PrinterHistoryDto
 * @description DTO especializado para representar el historial de consumo mensual acumulado de una impresora.
 * Transforma los deltas calculados de la base de datos en una estructura legible para gráficas e indicadores.
 */
export class PrinterHistoryDto {
  /** @property {number} year - Año calendario del registro histórico. */
  @ApiProperty({ description: 'Año del registro' })
  year: number;

  /** @property {number} month - Mes cronológico del registro (1-12). */
  @ApiProperty({ description: 'Mes del registro' })
  month: number;

  /** @property {number} print_only - Volumen de impresiones directas (delta). */
  @ApiProperty({ description: 'Cantidad de impresiones (Solo Impresiones)' })
  print_only: number;

  /** @property {number} copies - Volumen de copias procesadas (delta). */
  @ApiProperty({ description: 'Cantidad de copias' })
  copies: number;

  /** @property {number} print_total - Sumatoria total del consumo (KPI Oficial del periodo). */
  @ApiProperty({ description: 'Total Mensual (KPI Oficial)' })
  print_total: number;

  /**
   * @constructor
   * @param {any} row - Datos crudos del registro mensual para mapear.
   */
  constructor(row: any) {
    this.year = row.year;
    this.month = row.month;

    this.print_only = Number(row.print_only_delta ?? row.printOnlyDelta) || 0;
    this.copies = Number(row.copy_delta ?? row.copyDelta) || 0;
    this.print_total =
      Number(row.print_total_delta ?? row.printTotalDelta) || 0;
  }
}

