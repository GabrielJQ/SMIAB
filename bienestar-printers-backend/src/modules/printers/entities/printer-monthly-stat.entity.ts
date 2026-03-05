import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Printer } from './printer.entity';

@Entity('printer_monthly_stats')
export class PrinterMonthlyStat {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: string;

    @Column({ name: 'asset_id', type: 'bigint' })
    assetId: string;

    @Column({ type: 'int' })
    year: number;

    @Column({ type: 'int' })
    month: number;

    @Column({ name: 'print_total_delta', type: 'bigint', default: 0 })
    printTotalDelta: string;

    @Column({ name: 'copy_delta', type: 'bigint', default: 0 })
    copyDelta: string;

    @Column({ name: 'print_only_delta', type: 'bigint', default: 0 })
    printOnlyDelta: string;

    @Column({ name: 'print_total_reading', type: 'bigint', default: 0 })
    printTotalReading: string;

    @Column({ name: 'print_only_reading', type: 'bigint', default: 0 })
    printOnlyReading: string;

    @Column({ name: 'copy_reading', type: 'bigint', default: 0 })
    copyReading: string;

    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    // Many-to-One relationship to Printer
    // In your supabase queries, it joins printer_monthly_stats -> printers!inner(unit_id).
    // This implies there is a foreign key from printer_monthly_stats to printers.
    // We assume the foreign key is `asset_id` mapping to `printers.asset_id` or `id`.
    @ManyToOne(() => Printer, (printer) => printer.monthlyStats)
    @JoinColumn({ name: 'asset_id', referencedColumnName: 'assetId' })
    printer: Printer;
}
