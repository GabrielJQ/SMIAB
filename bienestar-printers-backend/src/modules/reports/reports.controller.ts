import { Controller, Get, Query, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { ExportReportDto } from './dto/export-report.dto';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserJwtPayload } from '../../auth/interfaces/user-jwt.interface';

/**
 * @description Controlador encargado de la capa de presentación de reportes en formato hoja de cálculo.
 * Expone endpoints asegurados bajo Supabase (JWT) y el rol del colaborador/administrador.
 */
@Controller('reports')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * @description Endpoint tipo GET que construye y transfiere el reporte de impresoras (mensual/anual) en formato Excel (.xlsx).
   * Valida la identidad y pertenencia institucional del usuario conectado.
   * 
   * @param {UserJwtPayload} user - Payload encriptado extraído del token, contiene el `unitId` o `areaId`.
   * @param {ExportReportDto} dto - Parámetros de validación de URL (tipo de reporte, año y mes).
   * @param {Response} res - Objeto respuesta nativo de Express (vital para forzar la descarga de binarios).
   * @returns {Promise<void>} Streaming del archivo Excel directamente a la red del cliente.
   */
  @Get('export/excel')
  async exportExcel(
    @CurrentUser('internal') user: UserJwtPayload,
    @Query() dto: ExportReportDto,
    @Res() res: Response
  ) {
    const unitId = user.unitId || user.areaId;
    if (!unitId) throw new ForbiddenException('User has no unit assigned');
    
    try {
      await this.reportsService.exportExcel(unitId, dto, res);
    } catch (error) {
      console.error('[ExportExcel Error]:', error);
      res.status(500).json({ statusCode: 500, message: error.message, stack: error.stack });
    }
  }
}
