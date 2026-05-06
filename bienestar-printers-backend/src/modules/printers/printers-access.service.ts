import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Printer } from './entities/printer.entity';
import { PrintersRepository } from './repositories/printers.repository';

@Injectable()
export class PrintersAccessService {
  constructor(
    private readonly printersRepository: PrintersRepository,
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

    const row = await this.printersRepository.getPrinterByIdQuery(printerId);
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
