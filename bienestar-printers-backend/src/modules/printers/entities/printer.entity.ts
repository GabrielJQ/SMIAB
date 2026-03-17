import { Entity, Column, PrimaryColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { PrinterMonthlyStat } from '../entities/printer-monthly-stat.entity';
import { PrinterTonerChange } from '../../toners/entities/printer-toner-change.entity';
import { Department } from './department.entity';
import { Unit } from './unit.entity';
import { Region } from './region.entity';

@Entity('printers')
export class Printer {
    @PrimaryColumn({ name: 'asset_id', type: 'bigint' })
    assetId: string;

    @Column({ name: 'ip_printer', type: 'inet', nullable: false })
    ipPrinter: string;

    @Column({ name: 'name_printer', type: 'varchar', nullable: true })
    namePrinter: string;

    @Column({ name: 'department_id', type: 'bigint', nullable: true })
    departmentId: string;

    @Column({ name: 'unit_id', type: 'bigint', nullable: true })
    unitId: string;

    @Column({ name: 'region_id', type: 'bigint', nullable: true })
    regionId: string;

    @Column({ name: 'printer_status', type: 'varchar', default: 'UNKNOWN' })
    printerStatus: string;

    @Column({ name: 'toner_lvl', type: 'int', default: 0 })
    tonerLvl: number;

    @Column({ name: 'total_pages_printed', type: 'bigint', default: 0 })
    totalPagesPrinted: string;

    @Column({ name: 'print_only_pages', type: 'bigint', default: 0 })
    printOnlyPages: string;

    @Column({ name: 'copy_pages', type: 'bigint', default: 0 })
    copyPages: string;

    @Column({ name: 'last_read_at', type: 'timestamp', nullable: true })
    lastReadAt: Date;

    @Column({ name: 'kit_mttnce_lvl', type: 'int', default: 0 })
    kitMttnceLvl: number;

    @Column({ name: 'uni_img_lvl', type: 'int', default: 0 })
    uniImgLvl: number;

    @Column({ name: 'created_at', type: 'timestamp', nullable: true })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Department, (dept) => dept.printers)
    @JoinColumn({ name: 'department_id' })
    department: Department;

    @ManyToOne(() => Unit, (unit) => unit.printers)
    @JoinColumn({ name: 'unit_id' })
    unit: Unit;

    @ManyToOne(() => Region, (region) => region.printers)
    @JoinColumn({ name: 'region_id' })
    region: Region;

    @OneToMany(() => PrinterMonthlyStat, (stat: PrinterMonthlyStat) => stat.printer)
    monthlyStats: PrinterMonthlyStat[];

    @OneToMany(() => PrinterTonerChange, (change: PrinterTonerChange) => change.printer)
    tonerChanges: PrinterTonerChange[];
}
