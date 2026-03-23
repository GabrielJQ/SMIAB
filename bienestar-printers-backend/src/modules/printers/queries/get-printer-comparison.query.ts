import { Repository } from 'typeorm';
import { PrinterMonthlyStat } from '../entities/printer-monthly-stat.entity';

/**
 * @function getPrinterComparisonQuery
 * @description Recupera los últimos N registros mensuales de una impresora para propósitos de comparación temporal.
 * Obtiene los datos en orden descendente pero los retorna en orden ascendente para facilitar su mapeo en gráficas lineales.
 * 
 * @param {Repository<PrinterMonthlyStat>} statRepository - Repositorio de estadísticas.
 * @param {string} printerId - ID del activo.
 * @param {number} months - Cantidad de meses retrospectivos a obtener.
 * @returns {Promise<PrinterMonthlyStat[]>} Lista cronológica de los últimos periodos solicitados.
 */
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

