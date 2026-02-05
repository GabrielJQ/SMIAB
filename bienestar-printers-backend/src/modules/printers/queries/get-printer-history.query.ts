import { SupabaseClient } from '@supabase/supabase-js';
import { PrinterMonthlyStats } from '../types/printer-monthly-stats.type';

interface GetPrinterHistoryParams {
    printerId: string;
    startYear?: number;
    startMonth?: number;
    endYear?: number;
    endMonth?: number;
}

export async function getPrinterHistoryQuery(
    supabase: SupabaseClient,
    params: GetPrinterHistoryParams,
): Promise<PrinterMonthlyStats[]> {
    let query = supabase
        .from('printer_monthly_stats')
        .select('*')
        .eq('printer_id', params.printerId);

    // Filtro de inicio (Mayor o igual)
    if (params.startYear) {
        if (params.startMonth) {
            // Logic for: (year > startYear) OR (year = startYear AND month >= startMonth)
            // Supabase supports simple filters. Complex ORs can be tricky.
            // Simpler approach for reliability: Filter mostly in DB, precise in code if needed, but lets try to push to DB.
            // SQL: WHERE (year > SY) OR (year = SY AND month >= SM)
            // Supabase .or() syntax: .or(`year.gt.${params.startYear},and(year.eq.${params.startYear},month.gte.${params.startMonth})`)

            const filter = `year.gt.${params.startYear},and(year.eq.${params.startYear},month.gte.${params.startMonth})`;
            query = query.or(filter);
        } else {
            query = query.gte('year', params.startYear);
        }
    }

    // Filtro de fin (Menor o igual)
    if (params.endYear) {
        if (params.endMonth) {
            const filter = `year.lt.${params.endYear},and(year.eq.${params.endYear},month.lte.${params.endMonth})`;
            query = query.or(filter);
        } else {
            query = query.lte('year', params.endYear);
        }
    }

    // Ordenar por fecha
    query = query.order('year', { ascending: true }).order('month', { ascending: true });

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data as PrinterMonthlyStats[];
}
