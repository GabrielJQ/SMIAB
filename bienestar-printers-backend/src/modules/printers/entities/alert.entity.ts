import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Printer } from './printer.entity';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'printer_id', type: 'bigint' })
  printerId: string;

  @Column({ type: 'varchar', default: 'TONER_LOW' })
  type: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status: string; // PENDING, RESOLVED

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @ManyToOne(() => Printer)
  @JoinColumn({ name: 'printer_id', referencedColumnName: 'assetId' })
  printer: Printer;
}
