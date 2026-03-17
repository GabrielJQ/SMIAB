import { Repository } from 'typeorm';
import { PrinterMonthlyStat } from '../entities/printer-monthly-stat.entity';

interface GetPrinterHistoryParams {
    printerId: string;
    startYear?: number;
    startMonth?: number;
    endYear?: number;
    endMonth?: number;
}

export async function getPrinterHistoryQuery(
    statRepository: Repository<PrinterMonthlyStat>,
    params: GetPrinterHistoryParams,
): Promise<PrinterMonthlyStat[]> {
    const query = statRepository.createQueryBuilder('stats')
        .where('stats.asset_id = :printerId', { printerId: params.printerId });

    // Replicating DateRangeFilter logic with TypeORM QueryBuilder
    if (params.startYear) {
        query.andWhere('(stats.year > :startYear OR (stats.year = :startYear AND stats.month >= :startMonth))', {
            startYear: params.startYear,
            startMonth: params.startMonth || 1
        });
    }

    if (params.endYear) {
        query.andWhere('(stats.year < :endYear OR (stats.year = :endYear AND stats.month <= :endMonth))', {
            endYear: params.endYear,
            endMonth: params.endMonth || 12
        });
    }

    return query
        .orderBy('stats.year', 'ASC')
        .addOrderBy('stats.month', 'ASC')
        .getMany();
}
