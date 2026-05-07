import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from '../../../integrations/supabase/supabase.service';
import { Printer } from '../entities/printer.entity';
import { PrinterMonthlyStat } from '../entities/printer-monthly-stat.entity';
import { PrinterComparisonDto } from '../dto/printer-comparison.dto';

@Injectable()
export class PrintersRepository {
  constructor(
    private readonly supabase: SupabaseService,
    @InjectRepository(Printer)
    private readonly printerRepo: Repository<Printer>,
    @InjectRepository(PrinterMonthlyStat)
    private readonly statRepo: Repository<PrinterMonthlyStat>,
  ) {}

  async getPrinterByIdQuery(printerId: string) {
    return this.printerRepo.findOne({
      where: { assetId: printerId },
      relations: ['department', 'region'],
    });
  }

  async getPrinterComparisonQuery(printerId: string, months: number) {
    // Get last N months
    const data = await this.statRepo.find({
      where: { assetId: printerId },
      order: { year: 'DESC', month: 'DESC' },
      take: months,
    });

    // Return chronologically for frontend ease
    return data.reverse();
  }

  async getPrinterHistoryQuery(params: {
    printerId: string;
    startYear?: number;
    startMonth?: number;
    endYear?: number;
    endMonth?: number;
  }) {
    const query = this.statRepo
      .createQueryBuilder('stats')
      .where('stats.asset_id = :printerId', { printerId: params.printerId });

    // Replicating DateRangeFilter logic with TypeORM QueryBuilder
    if (params.startYear) {
      query.andWhere(
        '(stats.year > :startYear OR (stats.year = :startYear AND stats.month >= :startMonth))',
        {
          startYear: params.startYear,
          startMonth: params.startMonth || 1,
        },
      );
    }

    if (params.endYear) {
      query.andWhere(
        '(stats.year < :endYear OR (stats.year = :endYear AND stats.month <= :endMonth))',
        {
          endYear: params.endYear,
          endMonth: params.endMonth || 12,
        },
      );
    }

    return query
      .orderBy('stats.year', 'ASC')
      .addOrderBy('stats.month', 'ASC')
      .getMany();
  }

  async getPrinterYearlySummaryQuery(printerId: string, year: number) {
    return this.statRepo.find({
      where: { assetId: printerId, year },
      order: { month: 'ASC' },
    });
  }

  async getPrintersByAreaQuery(areaId: string) {
    return this.printerRepo.find({
      where: { departmentId: areaId },
      order: { namePrinter: 'ASC' },
    });
  }

  async getPrintersByUnitQuery(unitId: string) {
    return this.printerRepo.find({
      where: { unitId },
      relations: ['department'],
      order: { namePrinter: 'ASC' },
    });
  }

  async getUnitHistoryQuery(unitId: string, year: number, month: number) {
    // Use TypeORM QueryBuilder to perform SUM and GROUP BY on the database directly
    const results = await this.statRepo
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

  async getPrinterSummaryQuery(unitId: string) {
    return this.printerRepo.find({
      where: { unitId },
      relations: ['department'],
      order: { namePrinter: 'ASC' },
    });
  }
}
