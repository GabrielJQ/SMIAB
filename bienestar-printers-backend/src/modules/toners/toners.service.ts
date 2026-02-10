import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { getUnitTonerHistoryQuery } from './queries/get-unit-toner-history.query';
import { getPrinterTonerHistoryQuery } from './queries/get-printer-toner-history.query';
import { TonerHistoryDto } from './dto/toner-history.dto';

// Reuse existing queries for Authorization steps
import { getUnitByAreaQuery } from '../printers/queries/get-unit-by-area.query';
import { getPrinterByIdQuery } from '../printers/queries/get-printer-by-id.query';

@Injectable()
export class TonersService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    // ==========================================
    //  AUTHORIZATION HELPERS
    // ==========================================

    private async validatePrinterAccess(printerId: string, userAreaId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // 1. Get Printer and its Unit
        const row = await getPrinterByIdQuery(supabase, printerId);
        if (!row) throw new BadRequestException('Printer not found');

        // 2. Get User's Unit
        const userUnitId = await getUnitByAreaQuery(supabase, userAreaId);

        // 3. Compare
        const area = Array.isArray(row.areas) ? row.areas[0] : row.areas;
        const printerUnitId = area?.unit_id;

        if (!userUnitId || printerUnitId !== userUnitId) {
            throw new ForbiddenException('Access to printer denied (Different Unit)');
        }
        return { printerId, userUnitId };
    }

    // ==========================================
    //  PUBLIC METHODS
    // ==========================================

    async getUnitHistory(userAreaId: string, months: number): Promise<TonerHistoryDto[]> {
        const supabase = this.supabaseService.getAdminClient();

        const unitId = await getUnitByAreaQuery(supabase, userAreaId);
        if (!unitId) throw new ForbiddenException('User area has no unit assigned');

        const rows = await getUnitTonerHistoryQuery(supabase, unitId, months);

        return rows.map(row => new TonerHistoryDto(row));
    }

    async getPrinterHistory(printerId: string, userAreaId: string, months: number): Promise<TonerHistoryDto[]> {
        await this.validatePrinterAccess(printerId, userAreaId);

        const supabase = this.supabaseService.getAdminClient();
        const rows = await getPrinterTonerHistoryQuery(supabase, printerId, months);

        return rows.map(row => new TonerHistoryDto(row));
    }
}
