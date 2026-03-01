import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Printer } from './printer.entity';

@Entity('printer_monthly_stats')
export class PrinterMonthlyStat {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'asset_id', type: 'varchar' }) // Might be used as FK, but we join on id or asset_id? Supabase query did .eq('printers.unit_id', unitId) so it implies a FK to `printers` table.
    assetId: string;

    @Column({ type: 'int' })
    year: number;

    @Column({ type: 'int' })
    month: number;

    @Column({ name: 'print_only_delta', type: 'int', default: 0 })
    printOnlyDelta: number;

    @Column({ name: 'copy_delta', type: 'int', default: 0 })
    copyDelta: number;

    @Column({ name: 'print_total_delta', type: 'int', default: 0 })
    printTotalDelta: number;

    // Many-to-One relationship to Printer
    // In your supabase queries, it joins printer_monthly_stats -> printers!inner(unit_id).
    // This implies there is a foreign key from printer_monthly_stats to printers.
    // We assume the foreign key is `asset_id` mapping to `printers.asset_id` or `id`.
    @ManyToOne(() => Printer, (printer) => printer.monthlyStats)
    @JoinColumn({ name: 'asset_id', referencedColumnName: 'assetId' })
    printer: Printer;
}
