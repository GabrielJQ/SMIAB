import { Controller, Get, UseGuards, ForbiddenException, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { TonersService } from './toners.service';
import { TonerHistoryDto } from './dto/toner-history.dto';
import { UserJwtPayload } from '../../auth/interfaces/user-jwt.interface';

@ApiTags('Toners')
@Controller('toners')
@UseGuards(SupabaseAuthGuard)
export class TonersController {
    constructor(private readonly tonersService: TonersService) { }

    @ApiOperation({ summary: 'Obtener historial de consumo de toners de la unidad' })
    @ApiQuery({ name: 'months', required: false, type: Number, description: 'Cantidad de meses a comparar (default: 6)' })
    @ApiOkResponse({ description: 'Historial de unidad', type: [TonerHistoryDto] })
    @Get('unit/history')
    async getUnitHistory(
        @CurrentUser('internal') user: UserJwtPayload,
        @Query('months') months?: string,
    ) {
        const unitId = user.unitId || user.areaId;
        if (!unitId) throw new ForbiddenException('User has no unit assigned');
        const monthsLimit = months ? parseInt(months) : 1;
        return this.tonersService.getUnitHistory(unitId, monthsLimit);
    }

    @ApiOperation({ summary: 'Obtener historial de consumo de toners por impresora' })
    @ApiParam({ name: 'id', description: 'ID de la impresora' })
    @ApiQuery({ name: 'months', required: false, type: Number, description: 'Cantidad de meses a comparar (default: 6)' })
    @ApiOkResponse({ description: 'Historial de impresora', type: [TonerHistoryDto] })
    @Get('printer/:id/history')
    async getPrinterHistory(
        @CurrentUser('internal') user: UserJwtPayload,
        @Param('id') id: string,
        @Query('months') months?: string,
    ) {
        const unitId = user.unitId || user.areaId;
        if (!unitId) throw new ForbiddenException('User has no unit assigned');
        const monthsLimit = months ? parseInt(months) : 1;
        return this.tonersService.getPrinterHistory(id, unitId, monthsLimit);
    }
}
