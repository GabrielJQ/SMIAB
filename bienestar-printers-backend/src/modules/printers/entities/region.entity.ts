import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Unit } from './unit.entity';
import { Printer } from './printer.entity';

@Entity('regions')
export class Region {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ unique: true })
  regcve: number;

  @Column({ unique: true })
  regnom: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @OneToMany(() => Unit, (unit) => unit.region)
  units: Unit[];

  @OneToMany(() => Printer, (printer) => printer.region)
  printers: Printer[];
}
