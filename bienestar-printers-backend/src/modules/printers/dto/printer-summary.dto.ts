import { ApiProperty } from '@nestjs/swagger';

/**
 * @class PrinterSummaryDto
 * @description DTO híbrido que normaliza la información de las impresoras proveniente de 
 * Supabase y TypeORM para el frontend.
 */
export class PrinterSummaryDto {
  @ApiProperty({ description: 'ID de la impresora' })
  id: string;

  @ApiProperty({ description: 'Dirección IP de la impresora' })
  ipAddress: string;

  @ApiProperty({ description: 'Nombre de la impresora' })
  name: string;

  @ApiProperty({ description: 'Nombre del área', nullable: true })
  area: string | null;

  @ApiProperty({ description: 'Estado de conexión', example: true })
  isOnline: boolean;

  @ApiProperty({ description: 'Nivel de tóner', nullable: true })
  tonerLevel: number | null;

  @ApiProperty({ description: 'Kit de mantenimiento', nullable: true })
  kitMaintenance: number | null;

  @ApiProperty({ description: 'Imagen de la unidad (ID)', nullable: true })
  unitImage: number | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Última lectura exitosa', nullable: true })
  lastSyncAt: Date | null;

  constructor(row: any) {
    // Soporte híbrido: Supabase (snake_case) y TypeORM (camelCase)
    this.id = row.asset_id ?? row.assetId ?? row.id;
    this.ipAddress = row.ip_printer ?? row.ipPrinter ?? '';
    this.name = row.name_printer ?? row.namePrinter;

    // Relaciones: Supabase usa arrays/objetos anidados, TypeORM usa entidades
    this.area =
      row.departments?.areanom ??
      row.department?.areanom ??
      row.areas?.areaname ??
      null;

    const status = (
      row.printer_status ??
      row.printerStatus ??
      ''
    ).toUpperCase();
    this.isOnline = status === 'ONLINE';

    this.tonerLevel = row.toner_lvl ?? row.tonerLvl ?? 0;
    this.kitMaintenance = row.kit_mttnce_lvl ?? row.kitMttnceLvl ?? 0;
    this.unitImage = row.uni_img_lvl ?? row.uniImgLvl ?? 0;

    const created = row.created_at ?? row.createdAt;
    this.createdAt = created ? new Date(created) : new Date();

    const lastSync = row.last_read_at ?? row.lastReadAt;
    this.lastSyncAt = lastSync ? new Date(lastSync) : null;
  }
}
