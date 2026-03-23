import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Department } from './department.entity';

/**
 * @class Address
 * @description Entidad que almacena la ubicación geográfica y postal detallada.
 * Se vincula con los departamentos para permitir la logística de entrega de tóners y mantenimiento.
 */
@Entity('addresses')
export class Address {
  /** @property {string} id - Identificador único de la dirección. */
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  /** @property {string} calle - Calle y número del sitio. */
  @Column({ nullable: true })
  calle: string;

  /** @property {string} colonia - Asentamiento o vecindario. */
  @Column({ nullable: true })
  colonia: string;

  /** @property {string} municipio - Municipio o alcaldía de la ubicación. */
  @Column({ nullable: true })
  municipio: string;

  /** @property {string} ciudad - Ciudad de residencia. */
  @Column({ nullable: true })
  ciudad: string;

  /** @property {string} estado - Entidad federativa. */
  @Column({ nullable: true })
  estado: string;

  /** @property {string} cp - Código postal (necesario para logística). */
  @Column({ nullable: true })
  cp: string;

  /** @property {Department[]} departments - Departamentos localizados bajo esta dirección física. */
  @OneToMany(() => Department, (dept) => dept.address)
  departments: Department[];
}

