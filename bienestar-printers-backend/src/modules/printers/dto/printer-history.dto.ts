import { ApiProperty } from '@nestjs/swagger';
import { PrinterMonthlyStats } from '../types/printer-monthly-stats.type';

export class PrinterHistoryDto {
    @ApiProperty({ description: 'Año del registro' })
    year: number;

    @ApiProperty({ description: 'Mes del registro' })
    month: number;

    @ApiProperty({ description: 'Cantidad de impresiones (Solo Impresiones)' })
    print_only: number;

    @ApiProperty({ description: 'Cantidad de copias' })
    copies: number;

    @ApiProperty({ description: 'Total Mensual (KPI Oficial)' })
    print_total: number;

    constructor(row: PrinterMonthlyStats) {
        this.year = row.year;
        this.month = row.month;

        this.print_only = Number(row.print_only_delta) || 0;
        this.copies = Number(row.copy_delta) || 0;
        this.print_total = Number(row.print_total_delta) || 0;
    }
}
