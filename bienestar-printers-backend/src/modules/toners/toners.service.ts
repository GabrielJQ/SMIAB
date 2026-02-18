import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { getUnitTonerHistoryQuery } from './queries/get-unit-toner-history.query';
import { getPrinterTonerHistoryQuery } from './queries/get-printer-toner-history.query';
import { TonerHistoryDto } from './dto/toner-history.dto';

// Reuse existing queries for Authorization steps
import { getPrinterByIdQuery } from '../printers/queries/get-printer-by-id.query';

@Injectable()
export class TonersService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    // ==========================================
    //  AUTHORIZATION HELPERS
    // ==========================================

    private async validatePrinterAccess(printerId: string, userUnitId: string) {
        if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
        const supabase = this.supabaseService.getAdminClient();

        // 1. Get Printer and its Unit
        const row = await getPrinterByIdQuery(supabase, printerId);
        if (!row) throw new BadRequestException('Printer not found');

        // 2. Get User's Unit
        // Already passed as arg

        // 3. Compare
        const printerUnitId = row.unit_id;

        if (!userUnitId || printerUnitId?.toString() !== userUnitId) {
            throw new ForbiddenException('Access to printer denied (Different Unit)');
        }
        return { printerId, userUnitId };
    }

    // ==========================================
    //  PUBLIC METHODS
    // ==========================================

    async getUnitHistory(userUnitId: string, months: number): Promise<TonerHistoryDto[]> {
        if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
        const supabase = this.supabaseService.getAdminClient();

        const rows = await getUnitTonerHistoryQuery(supabase, userUnitId, months);

        return rows.map(row => new TonerHistoryDto(row));
    }

    async getPrinterHistory(printerId: string, userAreaId: string, months: number): Promise<TonerHistoryDto[]> {
        await this.validatePrinterAccess(printerId, userAreaId);

        const supabase = this.supabaseService.getAdminClient();
        const rows = await getPrinterTonerHistoryQuery(supabase, printerId, months);

        return rows.map(row => new TonerHistoryDto(row));
    }
}
