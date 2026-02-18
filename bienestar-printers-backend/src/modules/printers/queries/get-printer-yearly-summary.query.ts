import { SupabaseClient } from '@supabase/supabase-js';
import { PrinterMonthlyStats } from '../types/printer-monthly-stats.type';

export async function getPrinterYearlySummaryQuery(
    supabase: SupabaseClient,
    printerId: string,
    year: number,
): Promise<PrinterMonthlyStats[]> {
    const { data, error } = await supabase
        .from('printer_monthly_stats')
        .select('*')
        .eq('asset_id', printerId)
        .eq('year', year)
        .order('month', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data as PrinterMonthlyStats[];
}
