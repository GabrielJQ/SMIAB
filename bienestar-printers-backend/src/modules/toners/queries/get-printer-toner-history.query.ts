import { Repository } from 'typeorm';
import { PrinterTonerChange } from '../entities/printer-toner-change.entity';

export async function getPrinterTonerHistoryQuery(
  tonerChangeRepository: Repository<PrinterTonerChange>,
  printerId: string,
  months: number,
): Promise<{ year: number; month: number; toner_count: number }[]> {
  // 1. Generate the strict list of months we want to show
  const monthsList: { year: number; month: number }[] = [];
  const today = new Date();
  // We want exactly 'months' entries, ending with current month
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthsList.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }

  // Calculate target date (start of the first month in our list)
  const firstMonth = monthsList[0];
  const targetDate = new Date(firstMonth.year, firstMonth.month - 1, 1);

  // Step 2: Use QueryBuilder to fetch grouped results from DB directly
  const results = await tonerChangeRepository
    .createQueryBuilder('change')
    .select('EXTRACT(YEAR FROM change.changedAt)', 'year') // Use Postgres EXTRACT function
    .addSelect('EXTRACT(MONTH FROM change.changedAt)', 'month')
    .addSelect('COUNT(change.id)', 'toner_count')
    .where('change.assetId = :printerId', { printerId })
    .andWhere('change.changedAt >= :targetDate', { targetDate })
    .groupBy('EXTRACT(YEAR FROM change.changedAt)')
    .addGroupBy('EXTRACT(MONTH FROM change.changedAt)')
    .getRawMany();

  const resultMap = new Map<string, number>();

  results.forEach((row) => {
    // results from EXTRACT might be returned as string or number depending on the pg driver version
    const y = Number(row.year);
    const m = Number(row.month);
    resultMap.set(`${y}-${m}`, Number(row.toner_count));
  });

  // Step 3: Map strictly to our months list
  return monthsList.map((item) => {
    const key = `${item.year}-${item.month}`;
    return {
      year: item.year,
      month: item.month,
      toner_count: resultMap.get(key) || 0,
    };
  });
}
