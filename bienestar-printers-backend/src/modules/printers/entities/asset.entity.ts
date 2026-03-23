import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { AssetAssignment } from './asset-assignment.entity';
import { Printer } from './printer.entity';
import { Department } from './department.entity';

/**
 * @class Asset
 * @description Representa un activo físico dentro del inventario centralizado (SAI).
 * Sirve como base para la vinculación con entidades de telemetría (Printer).
 */
@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ nullable: true })
  tag: string;

  @Column({ nullable: true })
  serie: string;

  @Column({ nullable: true })
  marca: string;

  @Column({ nullable: true })
  modelo: string;

  @Column({ name: 'department_id', type: 'bigint', nullable: true })
  departmentId: string;

  @OneToMany(() => AssetAssignment, (assignment) => assignment.asset)
  assignments: AssetAssignment[];

  @OneToOne(() => Printer, (printer) => printer.assetId)
  printer: Printer;

  @OneToOne(() => AssetAssignment, (assignment) => assignment.asset)
  @JoinColumn({ name: 'id', referencedColumnName: 'assetId' })
  currentAssignment: AssetAssignment;
}
