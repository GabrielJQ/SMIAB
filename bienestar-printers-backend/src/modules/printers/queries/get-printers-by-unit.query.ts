import { Repository } from 'typeorm';
import { Printer } from '../entities/printer.entity';

export async function getPrintersByUnitQuery(
  printerRepository: Repository<Printer>,
  unitId: string,
) {
  return printerRepository.find({
    where: { unitId },
    relations: ['department'],
    order: { namePrinter: 'ASC' },
  });
}
