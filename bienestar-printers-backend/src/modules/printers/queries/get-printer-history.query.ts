import { Repository } from 'typeorm';
import { PrinterMonthlyStat } from '../entities/printer-monthly-stat.entity';

/**
 * @description Definición de parámetros para el filtrado dinámico del historial de impresoras.
 */
export interface GetPrinterHistoryParams {
  /** ID del activo. */
  printerId: string;
  /** Año inicial del rango. */
  startYear?: number;
  /** Mes inicial del rango. */
  startMonth?: number;
  /** Año final del rango. */
  endYear?: number;
  /** Mes final del rango. */
  endMonth?: number;
}

/**
 * @description Construye una consulta dinámica avanzada para obtener el historial de consumo de una impresora.
 * Soporta filtrado por rangos temporales (inicio y fin) manejando comparaciones lógicas complejas de año/mes en SQL.
 * 
 * @param {Repository<PrinterMonthlyStat>} statRepository - Repositorio de estadísticas mensuales.
 * @param {GetPrinterHistoryParams} params - Criterios de filtrado temporal.
 * @returns {Promise<PrinterMonthlyStat[]>} Historial filtrado ordenado cronológicamente.
 */
export async function getPrinterHistoryQuery(
  statRepository: Repository<PrinterMonthlyStat>,
  params: GetPrinterHistoryParams,
): Promise<PrinterMonthlyStat[]> {
  const query = statRepository
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

