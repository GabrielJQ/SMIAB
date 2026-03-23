import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from '../../integrations/supabase/supabase.service';

import { getUnitTonerHistoryQuery } from './queries/get-unit-toner-history.query';
import { getPrinterTonerHistoryQuery } from './queries/get-printer-toner-history.query';
import { getUnitTopConsumersQuery } from './queries/get-unit-top-consumers.query';
import { getTonerHistoryByUnitQuery } from './queries/get-toner-history-by-unit.query';
import { getTonerHistoryByPrinterQuery } from './queries/get-toner-history-by-printer.query';
import { getTonerHistoryMonthlyQuery } from './queries/get-toner-history-monthly.query';

import { TonerHistoryDto } from './dto/toner-history.dto';
import { TonerChangeResponseDto } from './dto/toner-change-response.dto';

// Reuse existing queries for Authorization steps
import { getPrinterByIdQuery } from '../printers/queries/get-printer-by-id.query';
import { PrinterTonerChange } from './entities/printer-toner-change.entity';
import { Printer } from '../printers/entities/printer.entity';

/**
 * @class TonersService
 * @description Servicio especializado en la trazabilidad del ciclo de vida de los tóners.
 * Gestiona el historial de cambios, identifica consumos atípicos y genera reportes de agotamiento.
 */
@Injectable()
export class TonersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @InjectRepository(PrinterTonerChange)
    private readonly printerTonerChangeRepository: Repository<PrinterTonerChange>,
    @InjectRepository(Printer)
    private readonly printerRepository: Repository<Printer>,
  ) {}

  /**
   * @method validatePrinterAccess
   * @description Verifica si una impresora pertenece a la unidad administrativa del usuario.
   * @param {string} printerId - ID del activo.
   * @param {string} userUnitId - ID de la unidad del usuario.
   * @private
   */
  private async validatePrinterAccess(printerId: string, userUnitId: string) {
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    const row = await getPrinterByIdQuery(this.printerRepository, printerId);
    if (!row) throw new BadRequestException('Printer not found');

    const printerUnitId = row.unitId;

    if (!userUnitId || printerUnitId?.toString() !== userUnitId) {
      throw new ForbiddenException(
        'Access to printer denied (Different Unit)',
      );
    }
    return { printerId, userUnitId };
  }

  /**
   * @method getUnitHistory
   * @description Obtiene el conteo agregado de cambios de tóner por mes para una unidad administrativa.
   * Proporciona la base para el gráfico de "Agotamiento Mensual".
   * 
   * @param {string} unitId - ID de la unidad.
   * @param {Object} filters - Rango de fechas opcional.
   * @returns {Promise<TonerHistoryDto[]>} Lista de históricos por periodo.
   */
  async getUnitHistory(
    unitId: string,
    filters: {
      startYear?: number;
      startMonth?: number;
      endYear?: number;
      endMonth?: number;
    },
  ) {
    const rows = await getUnitTonerHistoryQuery(
      this.printerTonerChangeRepository,
      unitId,
      filters.startYear || new Date().getFullYear(),
      filters.startMonth || new Date().getMonth() + 1
    );
    return rows.map((row) => new TonerHistoryDto(row));
  }

  /**
   * @method getPrinterHistory
   * @description Recupera el historial detallado de reemplazos de cartucho para una impresora individual.
   * 
   * @param {string} printerId - ID del activo.
   * @param {Object} filters - Filtros de tiempo.
   * @returns {Promise<TonerHistoryDto[]>} Historial cronológico de cambios.
   */
  async getPrinterHistory(
    printerId: string,
    filters: {
      startYear?: number;
      startMonth?: number;
      endYear?: number;
      endMonth?: number;
    },
  ) {
    const rows = await getPrinterTonerHistoryQuery(
      this.printerTonerChangeRepository,
      printerId,
      filters.startYear || new Date().getFullYear(),
      filters.startMonth || new Date().getMonth() + 1
    );
    return rows.map((row) => new TonerHistoryDto(row));
  }

  /**
   * @method getUnitTopConsumers
   * @description Identifica el Top 10 de las impresoras con mayor tasa de cambio de tóner dentro de una unidad.
   * Ayuda a detectar equipos con fallas técnicas o uso excesivo de consumibles.
   * 
   * @param {string} unitId - ID de la unidad institucional.
   * @param {Object} filters - Periodo de análisis.
   * @returns {Promise<any[]>} Ranking de impresoras consumidoras.
   */
  async getUnitTopConsumers(
    unitId: string,
    filters: {
      startYear?: number;
      startMonth?: number;
      endYear?: number;
      endMonth?: number;
    },
  ) {
    const rows = await getUnitTopConsumersQuery(
      this.printerTonerChangeRepository,
      unitId,
      filters.startYear,
      filters.startMonth
    );
    return rows;
  }

  /**
   * @method getRecentChangesByUnit
   * @description Obtiene los últimos 20 cambios de tóner registrados en una unidad.
   * Ideal para feeds de actividad reciente y auditoría rápida.
   * 
   * @param {string} unitId - ID de la unidad.
   * @returns {Promise<TonerChangeResponseDto[]>} Lista de cambios recientes mapeados.
   */
  async getRecentChangesByUnit(unitId: string) {
    const rows = await getTonerHistoryByUnitQuery(
      this.supabaseService.getAdminClient(),
      unitId,
    );
    return rows.map((row) => new TonerChangeResponseDto(row));
  }

  /**
   * @method getRecentChangesByPrinter
   * @description Lista cronológica de cambios para un equipo específico en un periodo dado.
   * 
   * @param {string} printerId - ID de la impresora.
   * @param {Object} filters - Rango de búsqueda.
   * @returns {Promise<TonerChangeResponseDto[]>} Historial de cambios con modelo y fechas.
   */
  async getRecentChangesByPrinter(
    printerId: string,
    filters: {
      startYear?: number;
      startMonth?: number;
      endYear?: number;
      endMonth?: number;
    },
  ) {
    const rows = await getTonerHistoryByPrinterQuery(
      this.supabaseService.getAdminClient(),
      printerId,
      filters,
    );
    return rows.map((row) => new TonerChangeResponseDto(row));
  }

  /**
   * @method getMonthlySummaryByUnit
   * @description Resume el total de cambios de tóner de una unidad mes a mes.
   * 
   * @param {string} unitId - ID de la unidad.
   * @param {number} [months=12] - Meses retrospectivos.
   * @returns {Promise<any[]>} Agregado mensual histórico.
   */
  async getMonthlySummaryByUnit(unitId: string, months: number = 12) {
    const rows = await getTonerHistoryMonthlyQuery(
      this.supabaseService.getAdminClient(),
      unitId,
      months,
    );
    return rows;
  }
}
