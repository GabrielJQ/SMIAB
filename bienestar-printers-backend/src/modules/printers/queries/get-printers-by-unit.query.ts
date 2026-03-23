import { Repository } from 'typeorm';
import { Printer } from '../entities/printer.entity';

/**
 * @description Recupera el listado completo de activos de impresión filtrado por unidad administrativa.
 * Es la consulta base para poblar el inventario de la unidad en el dashboard principal.
 * 
 * @param {Repository<Printer>} printerRepository - Repositorio de la entidad Printer.
 * @param {string} unitId - ID de la unidad.
 * @returns {Promise<Printer[]>} Arreglo de impresoras ordenadas por nombre.
 */
export async function getPrintersByUnitQuery(
  printerRepository: Repository<Printer>,
  unitId: string,
) {
  return printerRepository.find({
    where: { unitId },
    relations: ['department'],
    order: { namePrinter: 'ASC' },
  });
}

