import { Repository } from 'typeorm';
import { Printer } from '../entities/printer.entity';

/**
 * @description Obtiene un listado simplificado de todas las impresoras pertenecientes a una unidad.
 * Incluye la relación con el departamento para mostrar la ubicación de cada activo.
 * Los resultados se ordenan alfabéticamente por el nombre de la impresora.
 * 
 * @param {Repository<Printer>} printerRepository - Repositorio de la entidad Printer.
 * @param {string} unitId - ID de la unidad administrativa.
 * @returns {Promise<Printer[]>} Arreglo de entidades Printer con su departamento cargado.
 */
export async function getPrinterSummaryQuery(
  printerRepository: Repository<Printer>,
  unitId: string,
) {
  return printerRepository.find({
    where: { unitId },
    relations: ['department'],
    order: { namePrinter: 'ASC' },
  });
}

