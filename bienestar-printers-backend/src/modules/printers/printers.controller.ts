import { Controller, Get, UseGuards, ForbiddenException, Param, Query, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { PrintersService } from './printers.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PrinterSummaryDto } from './dto/printer-summary.dto';
import { PrinterHistoryDto } from './dto/printer-history.dto';
import { PrinterYearlySummaryDto } from './dto/printer-yearly-summary.dto';
import { PrinterComparisonDto } from './dto/printer-comparison.dto';

@ApiTags('Printers')
@Controller('printers')
@UseGuards(SupabaseAuthGuard)
export class PrintersController {
  constructor(private readonly printersService: PrintersService) { }

  // ==========================================
  //  STATISTICS ENDPOINTS
  // ==========================================

  @ApiOperation({ summary: 'Obtener historial de impresiones de la unidad (Agregado)' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Cantidad de meses a comparar (default: 1)' })
  @ApiOkResponse({ description: 'Historial de unidad', type: [PrinterComparisonDto] })
  @Get('unit/history')
  async getUnitHistory(
    @CurrentUser('internal') user: any,
    @Query('months') months?: string,
  ) {
    if (!user?.areaId) throw new ForbiddenException('User has no area assigned');

    const monthsLimit = months ? parseInt(months) : 1;
    return this.printersService.getUnitHistory(user.areaId, monthsLimit);
  }

  @ApiOperation({ summary: 'Obtener historial de impresiones (Rango de Fechas)' })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiQuery({ name: 'startYear', required: false, type: Number })
  @ApiQuery({ name: 'startMonth', required: false, type: Number })
  @ApiQuery({ name: 'endYear', required: false, type: Number })
  @ApiQuery({ name: 'endMonth', required: false, type: Number })
  @ApiOkResponse({ description: 'Historial mensual', type: [PrinterHistoryDto] })
  @Get(':id/history')
  async getHistory(
    @CurrentUser('internal') user: any,
    @Param('id') id: string,
    @Query('startYear') startYear?: string,
    @Query('startMonth') startMonth?: string,
    @Query('endYear') endYear?: string,
    @Query('endMonth') endMonth?: string,
  ) {
    if (!user?.areaId) throw new ForbiddenException('User has no area assigned');

    return this.printersService.getPrinterHistory(id, user.areaId, {
      startYear: startYear ? parseInt(startYear) : undefined,
      startMonth: startMonth ? parseInt(startMonth) : undefined,
      endYear: endYear ? parseInt(endYear) : undefined,
      endMonth: endMonth ? parseInt(endMonth) : undefined,
    });
  }

  @ApiOperation({ summary: 'Obtener resumen anual de impresora' })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiParam({ name: 'year', description: 'Año a consultar' })
  @ApiOkResponse({ description: 'Resumen anual', type: PrinterYearlySummaryDto })
  @Get(':id/summary/:year')
  async getYearlySummary(
    @CurrentUser('internal') user: any,
    @Param('id') id: string,
    @Param('year', ParseIntPipe) year: number,
  ) {
    if (!user?.areaId) throw new ForbiddenException('User has no area assigned');

    return this.printersService.getPrinterYearlySummary(id, user.areaId, year);
  }

  @ApiOperation({ summary: 'Comparar últimos N meses' })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Cantidad de meses a comparar (default: 3)' })
  @ApiOkResponse({ description: 'Comparación mensual', type: [PrinterComparisonDto] })
  @Get(':id/compare')
  async getComparison(
    @CurrentUser('internal') user: any,
    @Param('id') id: string,
    @Query('months') months?: string,
  ) {
    if (!user?.areaId) throw new ForbiddenException('User has no area assigned');

    const monthsLimit = months ? parseInt(months) : 3;
    return this.printersService.getPrinterComparison(id, user.areaId, monthsLimit);
  }

  // ==========================================

  // ==========================================
  //  BASIC ENDPOINTS
  // ==========================================

  @ApiOperation({ summary: 'Obtener listado completo de impresoras de la unidad' })
  @ApiOkResponse({ description: 'Listado de impresoras de la unidad', type: [PrinterSummaryDto] })
  @Get('unit')
  async getByUnit(@CurrentUser('internal') user: any) {
    if (!user?.areaId) {
      throw new ForbiddenException('User has no area assigned');
    }
    return this.printersService.getPrintersByUnit(user.areaId);
  }

  @ApiOperation({ summary: 'Obtener listado de impresoras del área del usuario' })
  @ApiOkResponse({ description: 'Listado de impresoras del área', type: [PrinterSummaryDto] })
  @Get()
  async getAll(@CurrentUser('internal') user: any) {
    if (!user?.areaId) {
      throw new ForbiddenException('User has no area assigned');
    }
    return this.printersService.getPrintersByUserArea(user.areaId);
  }

  @ApiOperation({ summary: 'Obtener detalles de una impresora por ID' })
  @ApiParam({ name: 'id', description: 'ID de la impresora' })
  @ApiOkResponse({ description: 'Detalle de la impresora', type: PrinterSummaryDto })
  @Get(':id')
  async getOne(
    @CurrentUser('internal') user: any,
    @Param('id') id: string,
  ) {
    if (!user?.areaId) {
      throw new ForbiddenException('User has no area assigned');
    }
    const printer = await this.printersService.getPrinterById(id, user.areaId);

    if (!printer) {
      throw new NotFoundException('Printer not found');
    }

    return printer;
  }
}
