import { ApiProperty } from '@nestjs/swagger';

export class PrinterComparisonDto {
    @ApiProperty({ description: 'Año' })
    year: number;

    @ApiProperty({ description: 'Mes' })
    month: number;

    @ApiProperty({ description: 'Solo Impresiones' })
    print_only: number;

    @ApiProperty({ description: 'Copias' })
    copies: number;

    @ApiProperty({ description: 'Total Mensual' })
    print_total: number;

    constructor(row: any) {
        this.year = row.year;
        this.month = row.month;

        this.print_only = Number(row.print_only_delta) || 0;
        this.copies = Number(row.copy_delta) || 0;
        this.print_total = Number(row.print_total_delta) || 0;
    }
}
