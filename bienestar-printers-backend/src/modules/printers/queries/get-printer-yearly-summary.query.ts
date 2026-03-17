import { Repository } from 'typeorm';
import { PrinterMonthlyStat } from '../entities/printer-monthly-stat.entity';

export async function getPrinterYearlySummaryQuery(
  statRepository: Repository<PrinterMonthlyStat>,
  printerId: string,
  year: number,
): Promise<PrinterMonthlyStat[]> {
  return statRepository.find({
    where: { assetId: printerId, year },
    order: { month: 'ASC' },
  });
}
