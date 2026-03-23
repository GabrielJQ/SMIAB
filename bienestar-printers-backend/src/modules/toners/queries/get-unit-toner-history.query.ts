import { Repository } from 'typeorm';
import { PrinterTonerChange } from '../entities/printer-toner-change.entity';

/**
 * @description Agrupa dinámicamente los consumos de tóner a nivel de unidad administrativa.
 * Puede calcular los subtotales agrupados por mes o por área específica según el parámetro `groupBy`.nsulta genera un listado estricto desde enero hasta el mes seleccionado inclusive, asegurando que los meses sin actividad
 * se reporten con un conteo de cero. Utiliza funciones nativas de PostgreSQL (EXTRACT) para la agregación temporal.
 * 
 * @param {Repository<PrinterTonerChange>} tonerChangeRepository - Repositorio de TypeORM para cambios de tóner.
 * @param {string} unitId - Identificador de la unidad administrativa.
 * @param {number} year - Año de los registros a consultar.
 * @param {number} month - Mes límite del reporte (1-12).
 * @returns {Promise<Array<{year: number, month: number, toner_count: number}>>} Lista cronológica de consumos mensuales.
 */
export async function getUnitTonerHistoryQuery(
  tonerChangeRepository: Repository<PrinterTonerChange>,
  unitId: string,
  year: number,
  month: number,
): Promise<{ year: number; month: number; toner_count: number }[]> {
  // 1. Generate the strict list of months we want to show (Jan to selected month)
  const monthsList: { year: number; month: number }[] = [];
  for (let m = 1; m <= month; m++) {
    monthsList.push({ year, month: m });
  }

  // Step 2: Use QueryBuilder to fetch grouped results from DB directly
  const results = await tonerChangeRepository
    .createQueryBuilder('change')
    .select('EXTRACT(YEAR FROM change.changedAt)', 'year') // Use Postgres EXTRACT function
    .addSelect('EXTRACT(MONTH FROM change.changedAt)', 'month')
    .addSelect('COUNT(change.id)', 'toner_count')
    .innerJoin('change.printer', 'printer')
    .where('printer.unitId = :unitId', { unitId })
    .andWhere('EXTRACT(YEAR FROM change.changedAt) = :year', { year })
    .andWhere('EXTRACT(MONTH FROM change.changedAt) <= :month', { month })
    .groupBy('EXTRACT(YEAR FROM change.changedAt)')
    .addGroupBy('EXTRACT(MONTH FROM change.changedAt)')
    .getRawMany();

  // The database gives us only the months that had changes.
  // We need to merge this with our strict monthsList to ensure every month is reported (with 0 if no changes).
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

