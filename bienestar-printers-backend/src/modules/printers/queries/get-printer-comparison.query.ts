import { Repository } from 'typeorm';
import { PrinterMonthlyStat } from '../entities/printer-monthly-stat.entity';

export async function getPrinterComparisonQuery(
  statRepository: Repository<PrinterMonthlyStat>,
  printerId: string,
  months: number,
): Promise<PrinterMonthlyStat[]> {
  // Get last N months
  const data = await statRepository.find({
    where: { assetId: printerId },
    order: { year: 'DESC', month: 'DESC' },
    take: months,
  });

  // Return chronologically for frontend ease
  return data.reverse();
}
