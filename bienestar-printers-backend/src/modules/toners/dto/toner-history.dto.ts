import { ApiProperty } from '@nestjs/swagger';

export class TonerHistoryDto {
    @ApiProperty({ description: 'Año del registro', example: 2024 })
    year: number;

    @ApiProperty({ description: 'Mes del registro', example: 1 })
    month: number;

    @ApiProperty({ description: 'Cantidad de toners cambiados/contados', example: 5 })
    toner_count: number; // Simplified metric for Phase 0

    constructor(partial: Partial<TonerHistoryDto>) {
        Object.assign(this, partial);
    }
}
