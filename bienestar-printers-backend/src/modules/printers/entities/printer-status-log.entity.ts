import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Printer } from './printer.entity';

@Entity('printer_status_logs')
export class PrinterStatusLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'printer_id', type: 'bigint' })
    printerId: string;

    @Column({ name: 'toner_level', type: 'int', nullable: true })
    tonerLevel: number;

    @CreateDateColumn({ name: 'recorded_at', type: 'timestamp' })
    recordedAt: Date;

    @ManyToOne(() => Printer)
    @JoinColumn({ name: 'printer_id', referencedColumnName: 'assetId' })
    printer: Printer;
}
