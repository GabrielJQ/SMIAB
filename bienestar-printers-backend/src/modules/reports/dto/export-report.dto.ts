import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * @description Define la granularidad o periodicidad permitida para la extracción del reporte histórico Excel.
 */
export enum ReportType {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * @description DTO (Data Transfer Object) para la validación de la solicitud de exportación a Excel.
 * Filtra y asegura que los parámetros cumplan con el contrato esperado antes de ser procesados por el servicio.
 */
export class ExportReportDto {
  /** 
   * Tipo de reporte deseado. 
   * 'monthly' extrae un solo mes, 'yearly' iterará todo un año acumulando los 12 meses.
   */
  @IsEnum(ReportType)
  type: ReportType;

  /** 
   * Año del ejercicio a consultar. Obligatorio.
   */
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  /** 
   * Mes específico a consultar. Obligatorio solo si el tipo de reporte es 'monthly'.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
