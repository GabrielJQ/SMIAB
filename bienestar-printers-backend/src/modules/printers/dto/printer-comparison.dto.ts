import { ApiProperty } from '@nestjs/swagger';

/**
 * @class PrinterComparisonDto
 * @description Objeto de transferencia utilizado para comparar métricas de impresión y copiado entre diferentes periodos.
 * Facilita la visualización de crecimiento o ahorro en el consumo institucional.
 */
export class PrinterComparisonDto {
  /** @property {number} year - Año de la métrica comparativa. */
  @ApiProperty({ description: 'Año' })
  year: number;

  /** @property {number} month - Mes de la métrica comparativa. */
  @ApiProperty({ description: 'Mes' })
  month: number;

  /** @property {number} print_only - Delta de impresiones. */
  @ApiProperty({ description: 'Solo Impresiones' })
  print_only: number;

  /** @property {number} copies - Delta de copias. */
  @ApiProperty({ description: 'Copias' })
  copies: number;

  /** @property {number} print_total - Delta total acumulado. */
  @ApiProperty({ description: 'Total Mensual' })
  print_total: number;

  /**
   * @constructor
   * @param {any} row - Datos crudos para la inicialización.
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

