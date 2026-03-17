import { Repository } from 'typeorm';
import { Printer } from '../entities/printer.entity';

export async function getPrinterByIdQuery(
  printerRepository: Repository<Printer>,
  printerId: string,
) {
  return printerRepository.findOne({
    where: { assetId: printerId },
    relations: ['department', 'region'],
  });
}
