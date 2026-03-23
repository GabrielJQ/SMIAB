import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * @class TonerHistoryFilterDto
 * @description DTO utilizado para definir los parámetros de filtrado en las consultas de historial de tóners.
 * Permite especificar un rango temporal (inicio y fin) mediante meses y años para acotar los resultados del reporte.
 */
export class TonerHistoryFilterDto {
  /**
   * @property {number} [startYear]
   * @description Año inicial para el rango de búsqueda. Si no se especifica, el sistema puede asumir el año actual o el inicio del historial.
   */
  @ApiPropertyOptional({ description: 'Año de inicio para el filtro' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  startYear?: number;

  /**
   * @property {number} [startMonth]
   * @description Mes inicial (1-12) para el rango de búsqueda.
   */
  @ApiPropertyOptional({ description: 'Mes de inicio (1-12)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  startMonth?: number;

  /**
   * @property {number} [endYear]
   * @description Año final para el rango de búsqueda.
   */
  @ApiPropertyOptional({ description: 'Año de fin para el filtro' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  endYear?: number;

  /**
   * @property {number} [endMonth]
   * @description Mes final (1-12) para el rango de búsqueda.
   */
  @ApiPropertyOptional({ description: 'Mes de fin (1-12)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  endMonth?: number;
}

