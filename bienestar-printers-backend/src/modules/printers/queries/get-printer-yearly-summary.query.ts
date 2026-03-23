import { Repository } from 'typeorm';
import { PrinterMonthlyStat } from '../entities/printer-monthly-stat.entity';

/**
 * @description Extrae todas las estadísticas mensuales de una impresora para un año específico.
 * Estos datos se utilizan posteriormente para generar el DTO de resumen anual.
 * 
 * @param {Repository<PrinterMonthlyStat>} statRepository - Repositorio de estadísticas.
 * @param {string} printerId - ID del activo.
 * @param {number} year - Año de interés.
 * @returns {Promise<PrinterMonthlyStat[]>} Colección de métricas mensuales del año solicitante.
 */
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

