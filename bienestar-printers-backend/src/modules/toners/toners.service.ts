import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { getUnitTonerHistoryQuery } from './queries/get-unit-toner-history.query';
import { getPrinterTonerHistoryQuery } from './queries/get-printer-toner-history.query';
import { getUnitTopConsumersQuery } from './queries/get-unit-top-consumers.query';
import { TonerHistoryDto } from './dto/toner-history.dto';

// Reuse existing queries for Authorization steps
import { getPrinterByIdQuery } from '../printers/queries/get-printer-by-id.query';
import { PrinterTonerChange } from './entities/printer-toner-change.entity';

@Injectable()
export class TonersService {
    constructor(
        private readonly supabaseService: SupabaseService,
        @InjectRepository(PrinterTonerChange)
        private readonly printerTonerChangeRepository: Repository<PrinterTonerChange>,
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

        const rows = await getUnitTonerHistoryQuery(this.printerTonerChangeRepository, userUnitId, months);

        return rows.map(row => new TonerHistoryDto(row));
    }

    async getPrinterHistory(printerId: string, userAreaId: string, months: number): Promise<TonerHistoryDto[]> {
        await this.validatePrinterAccess(printerId, userAreaId);

        const rows = await getPrinterTonerHistoryQuery(this.printerTonerChangeRepository, printerId, months);

        return rows.map(row => new TonerHistoryDto(row));
    }

    async getUnitTopConsumers(userUnitId: string) {
        if (!userUnitId) throw new ForbiddenException('User has no unit assigned');
        return getUnitTopConsumersQuery(this.printerTonerChangeRepository, userUnitId);
    }
}
