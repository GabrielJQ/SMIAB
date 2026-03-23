import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AssetAssignment } from './asset-assignment.entity';
import { Department } from './department.entity';

/**
 * @class Employee
 * @description Representa a un empleado o resguardante dentro de la organización.
 * Vinculado a departamentos y asignaciones de activos.
 */
@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ nullable: true })
  nombre: string;

  @Column({ name: 'apellido_pat', nullable: true })
  apellido_pat: string;

  @Column({ name: 'apellido_mat', nullable: true })
  apellido_mat: string;

  @Column({ nullable: true })
  puesto: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  extension: string;

  @Column({ name: 'department_id', type: 'bigint', nullable: true })
  departmentId: string;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(() => AssetAssignment, (assignment) => assignment.employee)
  assignments: AssetAssignment[];
}
