import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Printer } from './entities/printer.entity';
import { getPrinterByIdQuery } from './queries/get-printer-by-id.query';

@Injectable()
export class PrintersAccessService {
  constructor(
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
  ) {}

  /**
   * @method validatePrinterAccess
   * @description Verifica si una impresora existe y si el usuario tiene permiso para acceder a ella
   * basándose en la Unidad/Área asignada.
   */
  async validatePrinterAccess(printerId: string, userUnitId: string) {
    if (!userUnitId) {
      throw new ForbiddenException('User has no unit assigned');
    }

    const row = await getPrinterByIdQuery(this.printerRepository, printerId);
    if (!row) {
      throw new BadRequestException('Printer not found');
    }

    const printerUnitId = row.unitId;

    if (printerUnitId?.toString() !== userUnitId.toString()) {
      throw new ForbiddenException('Access to printer denied (Different Unit)');
    }

    return row;
  }
}
