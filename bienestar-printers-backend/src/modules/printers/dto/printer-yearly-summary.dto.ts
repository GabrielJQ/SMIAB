import { ApiProperty } from '@nestjs/swagger';

/**
 * @class MonthlyBreakdown
 * @description Representa el volumen de impresión detallado para un mes específico dentro de un resumen anual.
 */
class MonthlyBreakdown {
  /** @property {number} month - Número de mes (1-12). */
  @ApiProperty({ description: 'Mes' })
  month: number;

  /** @property {number} printVolume - Cantidad total de páginas procesadas en ese mes. */
  @ApiProperty({ description: 'Volumen de impresiones' })
  printVolume: number;
}

/**
 * @class PrinterYearlySummaryDto
 * @description Proporciona un resumen ejecutivo del consumo anual de una impresora.
 * Consolida el total de impresiones, identifica el mes de mayor demanda y entrega un desglose mensual.
 */
export class PrinterYearlySummaryDto {
  /** @property {number} year - Año calendario del reporte. */
  @ApiProperty({ description: 'Año consultado' })
  year: number;

  /** @property {number} totalPrints - Sumatoria de todas las páginas impresas en el año. */
  @ApiProperty({ description: 'Total de impresiones en el año' })
  totalPrints: number;

  /** @property {object} busiestMonth - Información sobre el mes con el pico más alto de consumo. */
  @ApiProperty({
    description: 'Mes con mayor volumen de impresión',
    nullable: true,
  })
  busiestMonth: { month: number; volume: number } | null;

  /** @property {MonthlyBreakdown[]} monthlyBreakdown - Arreglo con la actividad mes a mes. */
  @ApiProperty({ description: 'Desglose mensual', type: [MonthlyBreakdown] })
  monthlyBreakdown: MonthlyBreakdown[];

  /**
   * @constructor
   * @param {number} year - Año del reporte.
   * @param {any[]} rows - Filas crudas de la base de datos para procesar.
   */
  constructor(year: number, rows: any[]) {
    this.year = year;
    this.monthlyBreakdown = rows.map((r) => ({
      month: r.month,
      printVolume: Number(r.print_total_delta ?? r.printTotalDelta ?? 0),
    }));

    this.totalPrints = this.monthlyBreakdown.reduce(
      (sum, item) => sum + item.printVolume,
      0,
    );

    const sorted = [...this.monthlyBreakdown].sort(
      (a, b) => b.printVolume - a.printVolume,
    );
    this.busiestMonth =
      sorted.length > 0
        ? { month: sorted[0].month, volume: sorted[0].printVolume }
        : null;
  }
}

