import { SupabaseClient } from '@supabase/supabase-js';
import { PrinterMonthlyStats } from '../types/printer-monthly-stats.type';

export async function getPrinterComparisonQuery(
    supabase: SupabaseClient,
    printerId: string,
    months: number,
): Promise<PrinterMonthlyStats[]> {
    // Obtener los últimos N meses disponibles
    const { data, error } = await supabase
        .from('printer_monthly_stats')
        .select('*')
        .eq('printer_id', printerId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(months);

    if (error) {
        throw new Error(error.message);
    }

    // Devolver ordenados cronológicamente para facilidad del frontend
    return (data as PrinterMonthlyStats[]).reverse();
}
