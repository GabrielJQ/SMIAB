import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { PrintersService } from './printers.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrinterSummaryDto } from './dto/printer-summary.dto';
import { PrinterHistoryDto } from './dto/printer-history.dto';
import { PrinterYearlySummaryDto } from './dto/printer-yearly-summary.dto';
import { PrinterComparisonDto } from './dto/printer-comparison.dto';
import { UserJwtPayload } from '../../auth/interfaces/user-jwt.interface';

import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { SnmpService } from '../snmp/snmp.service';

@ApiTags('Printers')
@Controller('printers')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class PrintersController {
  constructor(
    private readonly printersService: PrintersService,
    private readonly snmpService: SnmpService,
  ) {}

  // ==========================================
  //  STATISTICS ENDPOINTS
  // ==========================================

  @ApiOperation({
    summary: 'Obtener historial de impresiones de la unidad (Agregado)',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Cantidad de meses a comparar (default: 1)',
  })
  @ApiOkResponse({
    description: 'Historial de unidad',
    type: [PrinterComparisonDto],
  })
  @Get('unit/history')
  async getUnitHistory(
    @CurrentUser('internal') user: UserJwtPayload,
    @Query('months') months?: string,
  ) {
    const unitId = user.unitId || user.areaId;
    if (!unitId) throw new ForbiddenException('User has no unit assigned');

    const monthsLimit = months ? parseInt(months) : 1;
    return this.printersService.getUnitHistory(unitId, monthsLimit);
  }

  @ApiOperation({
    summary:
      'Obtener el estado operativo de la unidad (Total, Online, Offline)',
  })
  @ApiOkResponse({ description: 'Estado Operativo' })
  @Get('unit/status')
  async getOperationalStatus(@CurrentUser('internal') user: UserJwtPayload) {
    const userUnitId = user.unitId || user.areaId;
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
    return this.printersService.getOperationalStatus(userUnitId);
  }

  @ApiOperation({
    summary:
      'Obtener Consumo Global de Tóner de la unidad (12 meses por defecto)',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Cantidad de meses a pedir (default: 12)',
  })
  @ApiOkResponse({ description: 'Estadísticas de tóner' })
  @Get('unit/toner-stats')
  async getUnitTonerStats(
    @CurrentUser('internal') user: UserJwtPayload,
    @Query('months') months?: string,
  ) {
    const userUnitId = user.unitId || user.areaId;
    if (!userUnitId) throw new ForbiddenException('User has no unit assigned');

    const monthsLimit = months ? parseInt(months) : 12;
    return this.printersService.getUnitTonerStats(userUnitId, monthsLimit);
  }

  @ApiOperation({
    summary: 'Obtener listado completo de impresoras de la unidad',
  })
  @ApiOkResponse({
    description: 'Listado de impresoras de la unidad',
    type: [PrinterSummaryDto],
  })
  @Get('unit')
  async getByUnit(@CurrentUser('internal') user: UserJwtPayload) {
    const unitId = user.unitId || user.areaId;
    if (!unitId) {
      throw new ForbiddenException('User has no unit assigned');
    }
    return this.printersService.getPrintersByUnit(unitId);
  }

  // ==========================================
  //  DYNAMIC ID ENDPOINTS
  // ==========================================

  @ApiOperation({
    summary: 'Obtener historial de impresiones (Rango de Fechas)',
  })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiQuery({ name: 'startYear', required: false, type: Number })
  @ApiQuery({ name: 'startMonth', required: false, type: Number })
  @ApiQuery({ name: 'endYear', required: false, type: Number })
  @ApiQuery({ name: 'endMonth', required: false, type: Number })
  @ApiOkResponse({
    description: 'Historial mensual',
    type: [PrinterHistoryDto],
  })
  @Get(':id/history')
  async getHistory(
    @CurrentUser('internal') user: UserJwtPayload,
    @Param('id') id: string,
    @Query('startYear') startYear?: string,
    @Query('startMonth') startMonth?: string,
    @Query('endYear') endYear?: string,
    @Query('endMonth') endMonth?: string,
  ) {
    if (!user?.areaId)
      throw new ForbiddenException('User has no area assigned');

    return this.printersService.getPrinterHistory(id, user.areaId, {
      startYear: startYear ? parseInt(startYear) : undefined,
      startMonth: startMonth ? parseInt(startMonth) : undefined,
      endYear: endYear ? parseInt(endYear) : undefined,
      endMonth: endMonth ? parseInt(endMonth) : undefined,
    });
  }

  @ApiOperation({
    summary: 'Obtener Estadísticas Mensuales (Impresiones vs Tóner)',
  })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiOkResponse({ description: 'Datos agrupados para gráficas (Recharts)' })
  @Get(':id/monthly-stats')
  async getMonthlyStats(
    @CurrentUser('internal') user: UserJwtPayload,
    @Param('id') id: string,
  ) {
    if (!user?.areaId)
      throw new ForbiddenException('User has no area assigned');
    return this.printersService.getMonthlyStats(id, user.areaId);
  }

  @ApiOperation({ summary: 'Obtener resumen anual de impresora' })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiParam({ name: 'year', description: 'Año a consultar' })
  @ApiOkResponse({
    description: 'Resumen anual',
    type: PrinterYearlySummaryDto,
  })
  @Get(':id/summary/:year')
  async getYearlySummary(
    @CurrentUser('internal') user: UserJwtPayload,
    @Param('id') id: string,
    @Param('year', ParseIntPipe) year: number,
  ) {
    if (!user?.areaId)
      throw new ForbiddenException('User has no area assigned');

    return this.printersService.getPrinterYearlySummary(id, user.areaId, year);
  }

  @ApiOperation({ summary: 'Comparar últimos N meses' })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Cantidad de meses a comparar (default: 3)',
  })
  @ApiOkResponse({
    description: 'Comparación mensual',
    type: [PrinterComparisonDto],
  })
  @Get(':id/compare')
  async getComparison(
    @CurrentUser('internal') user: UserJwtPayload,
    @Param('id') id: string,
    @Query('months') months?: string,
  ) {
    if (!user?.areaId)
      throw new ForbiddenException('User has no area assigned');

    const monthsLimit = months ? parseInt(months) : 3;
    return this.printersService.getPrinterComparison(
      id,
      user.areaId,
      monthsLimit,
    );
  }

  @ApiOperation({
    summary: 'Obtener historial de nivel de tóner de los últimos 30 días',
  })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiOkResponse({ description: 'Historial de tóner', type: [Object] })
  @Get(':id/toner-history')
  async getTonerHistory(
    @CurrentUser('internal') user: UserJwtPayload,
    @Param('id') id: string,
  ) {
    if (!user?.areaId)
      throw new ForbiddenException('User has no area assigned');

    return this.printersService.getTonerHistory(id, user.areaId);
  }

  // ==========================================
  //  ALERTS ENDPOINTS
  // ==========================================

  @ApiOperation({ summary: 'Obtener alertas activas de la impresora' })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiOkResponse({ description: 'Listado de alertas pendientes' })
  @Get(':id/alerts')
  async getPrinterAlerts(
    @CurrentUser('internal') user: UserJwtPayload,
    @Param('id') id: string,
  ) {
    const unitId = user.unitId || user.areaId;
    if (!unitId) throw new ForbiddenException('User has no unit assigned');
    return this.printersService.getActiveAlerts(id, unitId);
  }

  @ApiOperation({ summary: 'Resolver / Marcar como revisada una alerta' })
  @ApiParam({ name: 'alertId', description: 'ID de la alerta' })
  @ApiOkResponse({ description: 'Alerta resuelta' })
  @Roles('super_admin', 'admin')
  @Post('alerts/:alertId/resolve')
  async resolveAlert(
    @CurrentUser('internal') user: UserJwtPayload,
    @Param('alertId') alertId: string,
  ) {
    const unitId = user.unitId || user.areaId;
    if (!unitId) throw new ForbiddenException('User has no unit assigned');
    return this.printersService.resolveAlert(alertId, unitId);
  }

  // ==========================================

  //  BASIC ENDPOINTS
  // ==========================================

  @ApiOperation({
    summary: 'Obtener listado de impresoras del área del usuario',
  })
  @ApiOkResponse({
    description: 'Listado de impresoras del área',
    type: [PrinterSummaryDto],
  })
  @Get()
  async getAll(@CurrentUser('internal') user: UserJwtPayload) {
    const areaId = user.departmentId || user.areaId;
    if (!areaId) {
      throw new ForbiddenException('User has no area assigned');
    }
    return this.printersService.getPrintersByUserArea(areaId);
  }

  @ApiOperation({
    summary: 'Obtener detalles de una impresora por ID (Lectura Universal)',
  })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiOkResponse({
    description: 'Detalle de la impresora',
    type: PrinterSummaryDto,
  })
  @Roles('super_admin', 'admin', 'collaborator', 'visitor') // Accesible por todos
  @Get(':id')
  async getOne(
    @CurrentUser('internal') user: UserJwtPayload,
    @Param('id') id: string,
  ) {
    const unitId = user.unitId || user.areaId;
    if (!unitId) {
      throw new ForbiddenException('User has no unit assigned');
    }
    const printer = await this.printersService.getPrinterById(id, unitId);

    if (!printer) {
      throw new NotFoundException('Printer not found');
    }

    return printer;
  }

  @ApiOperation({ summary: 'Registrar cambio manual de tóner' })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiOkResponse({ description: 'Confirmación de registro' })
  @Post(':id/toner-change')
  async registerManualTonerChange(
    @CurrentUser('internal') user: UserJwtPayload,
    @Param('id') id: string,
  ) {
    const unitId = user.unitId || user.areaId;
    if (!unitId) throw new ForbiddenException('User has no unit assigned');

    return this.printersService.registerManualTonerChange(id, unitId);
  }

  @ApiOperation({ summary: 'Forzar barrido SNMP de todas las impresoras' })
  @ApiOkResponse({ description: 'Resultado del barrido' })
  @Roles('super_admin', 'admin')
  @Post('sync')
  async syncAll() {
    return this.snmpService.forcePrinterUpdate();
  }

  @ApiOperation({
    summary: 'Forzar actualización SNMP de una impresora específica',
  })
  @ApiParam({ name: 'id', description: 'ID de la impresora (assetId)' })
  @ApiOkResponse({ description: 'Resultado de la actualización' })
  @Roles('super_admin', 'admin', 'collaborator')
  @Post(':id/sync')
  async syncOne(@Param('id') id: string) {
    return this.snmpService.forcePrinterUpdate(id);
  }
}
