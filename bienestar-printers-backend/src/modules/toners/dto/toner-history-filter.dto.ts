import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class TonerHistoryFilterDto {
    @ApiPropertyOptional({ description: 'Año de inicio para el filtro' })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    startYear?: number;

    @ApiPropertyOptional({ description: 'Mes de inicio (1-12)' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(12)
    @Type(() => Number)
    startMonth?: number;

    @ApiPropertyOptional({ description: 'Año de fin para el filtro' })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    endYear?: number;

    @ApiPropertyOptional({ description: 'Mes de fin (1-12)' })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(12)
    @Type(() => Number)
    endMonth?: number;
}
