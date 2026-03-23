import { ApiProperty } from '@nestjs/swagger';

/**
 * @class PrinterSummaryDto
 * @description DTO híbrido y normalizador que centraliza la información de las impresoras.
 * Resuelve las discrepancias de nomenclatura entre Supabase (snake_case) y TypeORM (camelCase), 
 * proporcionando una interfaz única y consistente para el frontend de SMIAB.
 */
export class PrinterSummaryDto {
  /** @property {string} id - Identificador único de la impresora (asset_id). */
  @ApiProperty({ description: 'ID de la impresora' })
  id: string;

  /** @property {string} ipAddress - Dirección IP de red del dispositivo. */
  @ApiProperty({ description: 'Dirección IP de la impresora' })
  ipAddress: string;

  /** @property {string} name - Nombre asignado o modelo descriptivo. */
  @ApiProperty({ description: 'Nombre de la impresora' })
  name: string;

  /** @property {string|null} area - Nombre de la unidad administrativa o departamento. */
  @ApiProperty({ description: 'Nombre del área', nullable: true })
  area: string | null;

  /** @property {boolean} isOnline - Flag calculado basado en el estado 'ONLINE' del hardware. */
  @ApiProperty({ description: 'Estado de conexión', example: true })
  isOnline: boolean;

  /** @property {number|null} tonerLevel - Último porcentaje de tóner reportado (0-100). */
  @ApiProperty({ description: 'Nivel de tóner', nullable: true })
  tonerLevel: number | null;

  /** @property {number|null} kitMaintenance - Porcentaje de vida restante del kit de mantenimiento. */
  @ApiProperty({ description: 'Kit de mantenimiento', nullable: true })
  kitMaintenance: number | null;

  /** @property {number|null} unitImage - Porcentaje de vida restante de la unidad de imagen. */
  @ApiProperty({ description: 'Imagen de la unidad (ID)', nullable: true })
  unitImage: number | null;

  /** @property {Date} createdAt - Fecha en que el activo fue dado de alta en el sistema. */
  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  /** @property {Date|null} lastSyncAt - Marca temporal de la última comunicación SNMP exitosa. */
  @ApiProperty({ description: 'Última lectura exitosa', nullable: true })
  lastSyncAt: Date | null;

  /**
   * @constructor
   * @param {any} row - Objeto con datos de origen (soporta múltiples formatos de naming).
   */
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

