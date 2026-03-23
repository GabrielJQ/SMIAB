import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Region } from './region.entity';
import { Department } from './department.entity';
import { Printer } from './printer.entity';

/**
 * @class Unit
 * @description Representa una 'Unidad' o centro de distribución administrativa de nivel medio.
 * Agrupa múltiples departamentos y gestiona su propia flota de activos.
 */
@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column()
  unicve: number;

  @Column()
  uninom: string;

  @Column({ name: 'region_id', type: 'bigint' })
  regionId: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @ManyToOne(() => Region, (region) => region.units)
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @OneToMany(() => Department, (dept) => dept.unit)
  departments: Department[];

  @OneToMany(() => Printer, (printer) => printer.unit)
  printers: Printer[];
}
