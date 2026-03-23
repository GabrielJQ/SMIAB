import { ApiProperty } from '@nestjs/swagger';

/**
 * @class TonerHistoryDto
 * @description Objeto de transferencia de datos (DTO) que representa el historial de consumo de tóners.
 * Almacena métricas simplificadas de cambios de tóner por mes y año, permitiendo la visualización
 * de tendencias de consumo en los tableros de control.
 */
export class TonerHistoryDto {
  /**
   * @property {number} year
   * @description El año calendario al que pertenece el registro del historial.
   * @example 2024
   */
  @ApiProperty({ description: 'Año del registro', example: 2024 })
  year: number;

  /**
   * @property {number} month
   * @description El mes del año (1-12) correspondiente a la métrica de consumo.
   * @example 1
   */
  @ApiProperty({ description: 'Mes del registro', example: 1 })
  month: number;

  /**
   * @property {number} toner_count
   * @description Cantidad total de cambios de tóner detectados o registrados en el periodo.
   * Esta es la métrica principal utilizada en la Fase 0 para medir la telemetría histórica.
   * @example 5
   */
  @ApiProperty({
    description: 'Cantidad de toners cambiados/contados',
    example: 5,
  })
  toner_count: number; // Simplified metric for Phase 0

  /**
   * @constructor
   * @param {Partial<TonerHistoryDto>} partial - Objeto parcial para inicializar el DTO mediante asignación directa.
   */
  constructor(partial: Partial<TonerHistoryDto>) {
    Object.assign(this, partial);
  }
}

