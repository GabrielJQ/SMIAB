import { Repository } from 'typeorm';
import { PrinterTonerChange } from '../entities/printer-toner-change.entity';

export async function getUnitTopConsumersQuery(
    tonerChangeRepository: Repository<PrinterTonerChange>,
    unitId: string,
): Promise<{ assetId: string; printerName: string; areaName: string; toner_count: string }[]> {
    const today = new Date();
    // Start of the current month
    const targetDate = new Date(today.getFullYear(), today.getMonth(), 1);

    // Group changes by printer
    const results = await tonerChangeRepository
        .createQueryBuilder('change')
        .select('printer.assetId', 'assetId')
        .addSelect('printer.namePrinter', 'printerName')
        // We might not have relation to departments/areas directly loaded in this simple entity, 
        // but we'll try to fetch what we have on the printer entity. 
        // Actually, Printer entity has departmentId, unitId, areaId etc. We'll return unitId or areaName if we can.
        // For now, let's keep it simple:
        .addSelect('COUNT(change.id)', 'toner_count')
        .innerJoin('change.printer', 'printer')
        .where('printer.unitId = :unitId', { unitId })
        .andWhere('change.changedAt >= :targetDate', { targetDate })
        .groupBy('printer.assetId')
        .addGroupBy('printer.namePrinter')
        .orderBy('COUNT(change.id)', 'DESC')
        .limit(10) // Top 10 consumers
        .getRawMany();

    return results;
}
