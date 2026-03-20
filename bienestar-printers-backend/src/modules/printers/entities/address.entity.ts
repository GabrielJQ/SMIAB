import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Department } from './department.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ nullable: true })
  calle: string;

  @Column({ nullable: true })
  colonia: string;

  @Column({ nullable: true })
  municipio: string;

  @Column({ nullable: true })
  ciudad: string;

  @Column({ nullable: true })
  estado: string;

  @Column({ nullable: true })
  cp: string;

  @OneToMany(() => Department, (dept) => dept.address)
  departments: Department[];
}
