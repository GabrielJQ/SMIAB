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

/**
 * @class Alert
 * @description Entidad que registra eventos críticos de telemetría o seguridad de las impresoras.
 * Permite la gestión proactiva de incidentes como consumibles bajos, intercambios sospechosos o cambios prematuros.
 */
@Entity('alerts')
export class Alert {
  /** @property {string} id - UUID identificador único de la alerta. */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** @property {string} printerId - Relación con el activo que disparó la alerta. */
  @Column({ name: 'printer_id', type: 'bigint' })
  printerId: string;

  /** @property {string} type - Tipo de evento (TONER_LOW, PREMATURE_CHANGE, SUSPICIOUS_SWAP). */
  @Column({ type: 'varchar', default: 'TONER_LOW' })
  type: string;

  /** @property {string} status - Estado de resolución (PENDING, RESOLVED). */
  @Column({ type: 'varchar', default: 'PENDING' })
  status: string; // PENDING, RESOLVED

  /** @property {Date} createdAt - Fecha en que el sistema detectó la anomalía. */
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  /** @property {Date|null} resolvedAt - Fecha en que un administrador marcó la alerta como atendida. */
  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  /** @property {any} metadata - JSON con detalles técnicos de la alerta (ej: niveles previos, IP). */
  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  /** @property {Printer} printer - Referencia al objeto Printer asociado. */
  @ManyToOne(() => Printer)
  @JoinColumn({ name: 'printer_id', referencedColumnName: 'assetId' })
  printer: Printer;
}

