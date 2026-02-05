import { ApiProperty } from '@nestjs/swagger';

export class PrinterSummaryDto {
  @ApiProperty({ description: 'ID de la impresora' })
  id: string;

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

  constructor(row: any) {
    this.id = row.id;
    this.name = row.name_printer;
    this.area = row.areas?.areaname ?? null;

    this.isOnline = row.printer_status === 'ONLINE';

    this.tonerLevel = row.toner_lvl ?? null;
    this.kitMaintenance = row.kit_mttnce ?? null;
    this.unitImage = row.uni_img ?? null;

    this.createdAt = new Date(row.created_at);
  }
}


