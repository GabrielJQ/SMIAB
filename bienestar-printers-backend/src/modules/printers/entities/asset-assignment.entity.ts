import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Asset } from './asset.entity';
import { Employee } from './employee.entity';
import { Department } from './department.entity';

/**
 * @class AssetAssignment
 * @description Registra la asignación histórica y actual de un activo a un empleado o departamento.
 * Permite rastrear el movimiento de las impresoras entre distintas áreas.
 */
@Entity('asset_assignments')
export class AssetAssignment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'asset_id', type: 'bigint' })
  assetId: string;

  @Column({ name: 'employee_id', type: 'bigint', nullable: true })
  employeeId: string;

  @Column({ name: 'department_id', type: 'bigint', nullable: true })
  departmentId: string;

  @Column({ name: 'is_current', type: 'boolean', default: true })
  isCurrent: boolean;

  @ManyToOne(() => Asset, (asset) => asset.assignments)
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @ManyToOne(() => Employee, (employee) => employee.assignments)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department: Department;
}
