import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Printer } from '../../printers/entities/printer.entity';

/**
 * @class PrinterTonerChange
 * @description Entidad que registra cada evento de cambio de tóner.
 * Puede ser detectado automáticamente por SNMP o registrado manualmente por el usuario.
 */
@Entity('printer_toner_changes')
export class PrinterTonerChange {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'asset_id', type: 'varchar' }) // The FK column
  assetId: string;

  @Column({ name: 'changed_at', type: 'timestamp' })
  changedAt: Date;

  @Column({ name: 'detection_type', type: 'varchar', default: 'manual' })
  detectionType: string;

  // Relation to printers
  @ManyToOne(() => Printer, (printer) => printer.tonerChanges)
  @JoinColumn({ name: 'asset_id', referencedColumnName: 'assetId' })
  printer: Printer;
}
