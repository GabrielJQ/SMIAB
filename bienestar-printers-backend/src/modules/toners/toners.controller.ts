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

@ApiTags('Toners')
@Controller('toners')
@UseGuards(SupabaseAuthGuard)
export class TonersController {
  constructor(private readonly tonersService: TonersService) {}

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
    return this.tonersService.getUnitHistory(
      unitId,
      parseInt(year || new Date().getFullYear().toString()),
      parseInt(month || (new Date().getMonth() + 1).toString())
    );
  }

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
    return this.tonersService.getPrinterHistory(
      id,
      unitId,
      parseInt(year || new Date().getFullYear().toString()),
      parseInt(month || (new Date().getMonth() + 1).toString())
    );
  }

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
    
    const parsedYear = year ? parseInt(year, 10) : undefined;
    const parsedMonth = month ? parseInt(month, 10) : undefined;

    return this.tonersService.getUnitTopConsumers(unitId, parsedYear, parsedMonth);
  }
}
