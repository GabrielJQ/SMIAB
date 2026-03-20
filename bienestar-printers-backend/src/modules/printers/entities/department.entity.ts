import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Unit } from './unit.entity';
import { Printer } from './printer.entity';
import { Address } from './address.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'unit_id', type: 'bigint' })
  unitId: string;

  @Column({ name: 'address_id', type: 'bigint', nullable: true })
  addressId: string;

  @Column()
  areacve: string;

  @Column()
  areanom: string;

  @Column({ default: 'Oficina' })
  tipo: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @ManyToOne(() => Unit, (unit) => unit.departments)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @ManyToOne(() => Address, (address) => address.departments)
  @JoinColumn({ name: 'address_id' })
  address: Address;

  @OneToMany(() => Printer, (printer) => printer.department)
  printers: Printer[];
}
