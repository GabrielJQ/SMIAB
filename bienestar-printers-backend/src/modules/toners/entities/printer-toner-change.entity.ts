import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Printer } from '../../printers/entities/printer.entity';

@Entity('printer_toner_changes')
export class PrinterTonerChange {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'asset_id', type: 'varchar' }) // The FK column
    assetId: string;

    @Column({ name: 'changed_at', type: 'timestamp' })
    changedAt: Date;

    // Relation to printers
    @ManyToOne(() => Printer, (printer) => printer.tonerChanges)
    @JoinColumn({ name: 'asset_id', referencedColumnName: 'assetId' })
    printer: Printer;
}
