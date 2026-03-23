import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Unit } from './unit.entity';
import { Printer } from './printer.entity';

/**
 * @class Region
 * @description Representa una división geográfica o administrativa (Región) del instituto.
 * Actúa como el nivel jerárquico superior que agrupa múltiples Unidades administrativas.
 */
@Entity('regions')
export class Region {
  /** @property {string} id - Identificador único incremental en Supabase. */
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** @property {number} regcve - Clave numérica oficial de la región. */
  @Column({ unique: true })
  regcve: number;

  /** @property {string} regnom - Nombre descriptivo de la región. */
  @Column({ unique: true })
  regnom: string;

  /** @property {Date} createdAt - Fecha de creación del registro. */
  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  /** @property {Date} updatedAt - Fecha de última modificación. */
  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  /** @property {Unit[]} units - Relación uno a muchos con las Unidades que integran esta región. */
  @OneToMany(() => Unit, (unit) => unit.region)
  units: Unit[];

  /** @property {Printer[]} printers - Relación con las impresoras localizadas en esta región. */
  @OneToMany(() => Printer, (printer) => printer.region)
  printers: Printer[];
}

