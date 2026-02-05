import { ApiProperty } from '@nestjs/swagger';

class MonthlyBreakdown {
    @ApiProperty({ description: 'Mes' })
    month: number;

    @ApiProperty({ description: 'Volumen de impresiones' })
    printVolume: number;
}

export class PrinterYearlySummaryDto {
    @ApiProperty({ description: 'Año consultado' })
    year: number;

    @ApiProperty({ description: 'Total de impresiones en el año' })
    totalPrints: number;

    @ApiProperty({ description: 'Mes con mayor volumen de impresión', nullable: true })
    busiestMonth: { month: number; volume: number } | null;

    @ApiProperty({ description: 'Desglose mensual', type: [MonthlyBreakdown] })
    monthlyBreakdown: MonthlyBreakdown[];

    constructor(year: number, rows: any[]) {
        this.year = year;
        this.monthlyBreakdown = rows.map((r) => ({
            month: r.month,
            printVolume: Number(r.print_delta),
        }));

        this.totalPrints = this.monthlyBreakdown.reduce((sum, item) => sum + item.printVolume, 0);

        const sorted = [...this.monthlyBreakdown].sort((a, b) => b.printVolume - a.printVolume);
        this.busiestMonth = sorted.length > 0 ? { month: sorted[0].month, volume: sorted[0].printVolume } : null;
    }
}
