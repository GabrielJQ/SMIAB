import { SupabaseClient } from '@supabase/supabase-js';
import { PrinterMonthlyStats } from '../types/printer-monthly-stats.type';
import { applyDateRangeFilter, DateRangeFilter } from '../../../common/utils/supabase-query-helpers';

interface GetPrinterHistoryParams extends DateRangeFilter {
    printerId: string;
}

export async function getPrinterHistoryQuery(
    supabase: SupabaseClient,
    params: GetPrinterHistoryParams,
): Promise<PrinterMonthlyStats[]> {
    let query = supabase
        .from('printer_monthly_stats')
        .select('*')
        .eq('printer_id', params.printerId);

    // Apply shared date range logic
    query = applyDateRangeFilter(query, params);

    // Order by date
    query = query.order('year', { ascending: true }).order('month', { ascending: true });

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data as PrinterMonthlyStats[];
}
