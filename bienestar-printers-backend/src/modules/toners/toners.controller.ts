import {
  Controller,
  Get,
  UseGuards,
  ForbiddenException,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { TonersService } from './toners.service';
import { TonerHistoryDto } from './dto/toner-history.dto';
import { UserJwtPayload } from '../../auth/interfaces/user-jwt.interface';

/**
 * @class TonersController
 * @description Controlador encargado de gestionar las operaciones relacionadas con el consumo de tóners.
 * Proporciona endpoints para consultar el historial de cambios tanto por unidad administrativa como por impresora individual,
 * facilitando el monitoreo de insumos y la detección de consumos atípicos en el sistema SMIAB.
 */
@ApiTags('Toners')
@Controller('toners')
@UseGuards(SupabaseAuthGuard)
export class TonersController {
  /**
   * @constructor
   * @param {TonersService} tonersService - Servicio inyectado para la lógica de negocio de tóners.
   */
  constructor(private readonly tonersService: TonersService) {}

  /**
   * @method getUnitHistory
   * @description Recupera el historial agregado de cambios de tóner para una unidad administrativa específica en un periodo dado.
   * Valida que el usuario tenga una unidad asignada antes de realizar la consulta.
   * 
   * @param {UserJwtPayload} user - Datos del usuario autenticado extraídos del JWT.
   * @param {string} year - Año de consulta (ej: "2024").
   * @param {string} month - Mes de consulta (1-12).
   * @returns {Promise<TonerHistoryDto[]>} Un arreglo de objetos DTO con el conteo de cambios por periodo.
   * @throws {ForbiddenException} Si el usuario no tiene una unidad (unitId) vinculada a su perfil.
   */
  @ApiOperation({
    summary: 'Obtener historial de consumo de toners de la unidad',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Historial de unidad',
    type: [TonerHistoryDto],
  })
  @Get('unit/history')
  async getUnitHistory(
    @CurrentUser('internal') user: UserJwtPayload,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const unitId = user.unitId || user.areaId;
    if (!unitId) throw new ForbiddenException('User has no unit assigned');
    return this.tonersService.getUnitHistory(unitId, {
      startYear: year ? parseInt(year) : undefined,
      startMonth: month ? parseInt(month) : undefined,
    });
  }


  /**
   * @method getPrinterHistory
   * @description Obtiene el historial detallado de cambios de tóner para una impresora específica.
   * Verifica la pertenencia de la impresora a la unidad del usuario para garantizar la seguridad de los datos.
   * 
   * @param {UserJwtPayload} user - Datos del usuario autenticado.
   * @param {string} id - Identificador único de la impresora (assetId).
   * @param {string} year - Año de consulta.
   * @param {string} month - Mes de consulta.
   * @returns {Promise<TonerHistoryDto[]>} Historial específico de la impresora solicitada.
   * @throws {ForbiddenException} Si la impresora no pertenece a la unidad del usuario solicitante.
   */
  @ApiOperation({
    summary: 'Obtener historial de consumo de toners por impresora',
  })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Historial de impresora',
    type: [TonerHistoryDto],
  })
  @Get('printer/:id/history')
  async getPrinterHistory(
    @CurrentUser('internal') user: UserJwtPayload,
    @Param('id') id: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const unitId = user.unitId || user.areaId;
    if (!unitId) throw new ForbiddenException('User has no unit assigned');
    return this.tonersService.getPrinterHistory(id, {
      startYear: year ? parseInt(year) : undefined,
      startMonth: month ? parseInt(month) : undefined,
    });
  }


  /**
   * @method getUnitTopConsumers
   * @description Identifica las impresoras con mayor frecuencia de cambio de tóner dentro de la unidad.
   * Se utiliza para detectar equipos con posibles fallas o uso excesivo de recursos.
   * 
   * @param {UserJwtPayload} user - Datos del usuario autenticado.
   * @param {string} [year] - Año (opcional, por defecto el actual).
   * @param {string} [month] - Mes (opcional, por defecto el actual).
   * @returns {Promise<any>} Listado de impresoras ordenadas por volumen de consumo de tóner.
   */
  @ApiOperation({
    summary: 'Obtener top consumidores de un mes específico para la unidad',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Año a consultar (default: actual)',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: Number,
    description: 'Mes a consultar 1-12 (default: actual)',
  })
  @ApiOkResponse({ description: 'Top Consumidores' })
  @Get('unit/top-consumers')
  async getUnitTopConsumers(
    @CurrentUser('internal') user: UserJwtPayload,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const unitId = user.unitId || user.areaId;
    if (!unitId) throw new ForbiddenException('User has no unit assigned');

    return this.tonersService.getUnitTopConsumers(unitId, {
      startYear: year ? parseInt(year, 10) : undefined,
      startMonth: month ? parseInt(month, 10) : undefined,
    });
  }

}

