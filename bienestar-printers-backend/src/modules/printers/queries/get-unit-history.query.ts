import { Repository } from 'typeorm';
import { PrinterComparisonDto } from '../dto/printer-comparison.dto';
import { PrinterMonthlyStat } from '../entities/printer-monthly-stat.entity';

export async function getUnitHistoryQuery(
  statRepository: Repository<PrinterMonthlyStat>,
  unitId: string,
  year: number,
  month: number,
): Promise<PrinterComparisonDto[]> {
  // Use TypeORM QueryBuilder to perform SUM and GROUP BY on the database directly
  const results = await statRepository
    .createQueryBuilder('stats')
    .select('stats.year', 'year')
    .addSelect('stats.month', 'month')
    .addSelect('SUM(stats.printOnlyDelta)', 'print_only')
    .addSelect('SUM(stats.copyDelta)', 'copies')
    .addSelect('SUM(stats.printTotalDelta)', 'print_total')
    .innerJoin('stats.printer', 'printer')
    .where('printer.unitId = :unitId', { unitId })
    .andWhere('stats.year = :year', { year })
    .andWhere('stats.month <= :month', { month })
    .groupBy('stats.year')
    .addGroupBy('stats.month')
    .orderBy('stats.year', 'ASC')
    .addOrderBy('stats.month', 'ASC')
    .getRawMany();

  // Map the raw results to the expected DTO shape
  return results.map(
    (item) =>
      new PrinterComparisonDto({
        year: item.year,
        month: item.month,
        print_only_delta: Number(item.print_only) || 0,
        copy_delta: Number(item.copies) || 0,
        print_total_delta: Number(item.print_total) || 0,
      }),
  );
}
