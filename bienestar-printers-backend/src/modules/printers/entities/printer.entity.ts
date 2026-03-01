import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { PrinterMonthlyStat } from './printer-monthly-stat.entity';
import { PrinterTonerChange } from '../../toners/entities/printer-toner-change.entity';

@Entity('printers')
export class Printer {
    @PrimaryColumn({ name: 'id', type: 'uuid' }) // Assuming UUID, adjust if it's string/varchar
    id: string;

    @Column({ name: 'asset_id', type: 'varchar', nullable: true })
    assetId: string;

    @Column({ name: 'name_printer', type: 'varchar', nullable: true })
    namePrinter: string;

    @Column({ name: 'unit_id', type: 'varchar', nullable: true })
    unitId: string;

    // Relations
    @OneToMany(() => PrinterMonthlyStat, (stat: PrinterMonthlyStat) => stat.printer)
    monthlyStats: PrinterMonthlyStat[];

    @OneToMany(() => PrinterTonerChange, (change: PrinterTonerChange) => change.printer)
    tonerChanges: PrinterTonerChange[];
}
