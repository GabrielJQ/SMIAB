import { Repository } from 'typeorm';
import { Printer } from '../entities/printer.entity';

/**
 * @description Filtra y retorna las impresoras que pertenecen a un área específica (departamento) dentro de una unidad.
 * Utilizada para vistas departamentales y gestión de activos localizados.
 * 
 * @param {Repository<Printer>} printerRepository - Repositorio de impresoras.
 * @param {string} areaId - Identificador único del área o departamento.
 * @returns {Promise<Printer[]>} Listado de impresoras del área solicitada.
 */
export async function getPrintersByAreaQuery(
  printerRepository: Repository<Printer>,
  areaId: string,
) {
  return printerRepository.find({
    where: { departmentId: areaId },
    order: { namePrinter: 'ASC' },
  });
}

