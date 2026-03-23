import { Repository } from 'typeorm';
import { PrinterTonerChange } from '../entities/printer-toner-change.entity';

/**
 * @description Identifica y agrupa las impresoras con mayor número de cambios de tóner en un periodo específico (mes/año).
 * Realiza un JOIN entre los cambios de tóner, las impresoras y sus departamentos para proporcionar un reporte detallado
 * del consumo por ubicación dentro de una unidad. Los resultados se limitan a los 10 principales consumidores.
 * 
 * @param {Repository<PrinterTonerChange>} tonerChangeRepository - Repositorio de TypeORM para la entidad PrinterTonerChange.
 * @param {string} unitId - Identificador único de la unidad administrativa a consultar.
 * @param {number} [year] - Año de consulta (por defecto el año actual).
 * @param {number} [month] - Mes de consulta (1-12, por defecto el mes actual).
 * @returns {Promise<Array<{assetId: string, printerName: string, areaName: string, toner_count: number, events: Array<{date: Date, type: string}>}>>} 
 * Lista de los 10 mayores consumidores con su conteo de tóners y desglose de eventos.
 */
export async function getUnitTopConsumersQuery(
  tonerChangeRepository: Repository<PrinterTonerChange>,
  unitId: string,
  year?: number,
  month?: number,
) {
  const today = new Date();
  const targetYear = year || today.getFullYear();
  // If month is provided use it (1-12), else use current month
  const targetMonth = month || today.getMonth() + 1;

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 1);

  // We use getRawMany to safely extract all fields avoiding complex entity nesting issues
  const rawChanges = await tonerChangeRepository
    .createQueryBuilder('change')
    .select('printer.assetId', 'assetId')
    .addSelect('printer.namePrinter', 'printerName')
    .addSelect('department.areanom', 'areaName')
    .addSelect('change.changedAt', 'changedAt')
    .addSelect('change.detectionType', 'detectionType')
    .innerJoin('change.printer', 'printer')
    .leftJoin('printer.department', 'department')
    .where('printer.unitId = :unitId', { unitId })
    .andWhere('change.changedAt >= :startDate', { startDate })
    .andWhere('change.changedAt < :endDate', { endDate })
    .orderBy('change.changedAt', 'DESC')
    .getRawMany();

  // Group by printer
  const grouped = new Map<
    string,
    {
      assetId: string;
      printerName: string;
      areaName: string;
      toner_count: number;
      events: { date: Date; type: string }[];
    }
  >();

  for (const row of rawChanges) {
    const assetId = row.assetId;
    if (!grouped.has(assetId)) {
      grouped.set(assetId, {
        assetId: assetId,
        printerName: row.printerName,
        areaName: row.areaName || 'Área no asignada',
        toner_count: 0,
        events: [],
      });
    }
    const group = grouped.get(assetId)!;
    group.toner_count++;
    group.events.push({
      date: row.changedAt,
      type: row.detectionType,
    });
  }

  // Sort by count DESC and take top 10
  const results = Array.from(grouped.values())
    .sort((a, b) => b.toner_count - a.toner_count)
    .slice(0, 10);

  return results;
}

