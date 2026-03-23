import { Repository } from 'typeorm';
import { Printer } from '../entities/printer.entity';

/**
 * @function getPrinterByIdQuery
 * @description Obtiene el perfil completo de una impresora mediante su identificador único.
 * Carga de forma ansiosa (Eager) las relaciones con el departamento y la región para proporcionar
 * el contexto organizacional completo del activo.
 * 
 * @param {Repository<Printer>} printerRepository - Repositorio de la entidad Printer.
 * @param {string} printerId - Identificador único de la impresora (assetId).
 * @returns {Promise<Printer|null>} Entidad Printer completa o nulo si no se encuentra.
 */
export async function getPrinterByIdQuery(
  printerRepository: Repository<Printer>,
  printerId: string,
) {
  return printerRepository.findOne({
    where: { assetId: printerId },
    relations: ['department', 'region'],
  });
}

