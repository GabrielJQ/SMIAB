import { Repository } from 'typeorm';
import { Printer } from '../entities/printer.entity';

export async function getPrintersByAreaQuery(
  printerRepository: Repository<Printer>,
  areaId: string,
) {
  return printerRepository.find({
    where: { departmentId: areaId },
    order: { namePrinter: 'ASC' },
  });
}
