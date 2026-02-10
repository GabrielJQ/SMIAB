import { ApiProperty } from '@nestjs/swagger';

export class TonerChangeResponseDto {
    @ApiProperty({ description: 'ID del registro de cambio' })
    id: number;

    @ApiProperty({ description: 'ID de la impresora (UUID)' })
    printer_id: string;

    @ApiProperty({ description: 'Modelo de tóner utilizado', enum: ['lexmark', 'kyocera'] })
    toner_model: string;

    @ApiProperty({ description: 'Fecha real del cambio' })
    changed_at: Date;

    @ApiProperty({ description: 'Fecha de registro en sistema' })
    created_at: Date;

    constructor(partial: Partial<TonerChangeResponseDto>) {
        Object.assign(this, partial);
    }
}
