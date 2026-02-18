import { SupabaseClient } from '@supabase/supabase-js';
import { PrinterComparisonDto } from '../dto/printer-comparison.dto';

export async function getUnitHistoryQuery(
    supabase: SupabaseClient,
    unitId: string,
    months: number,
): Promise<PrinterComparisonDto[]> {
    // Aggregate print_delta by year and month for a specific unit
    // Standard Supabase client doesn't support GROUP BY easily in JS client without RPC.
    // However, we can fetch raw data and aggregate in code if the dataset is small enough.
    // OR we can use the rpc if one existed (User said "No modificar esquema BDD", so no new RPCs).

    // Strategy: Fetch all stats for the unit for the last N months.
    // Since we are monitoring printers, the number of records = (Printers per Unit) * (Months).
    // Even with 100 printers and 12 months, that's 1200 rows. Fetching and reducing in Node is fine.

    // 1. Get range cutoff (approximate)
    // Actually, let's just use LIMIT and Order, but we need meaningful limit.
    // If we want "Last N Months", we need to filter by date.

    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1); // +1 because we include current month
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // 1-index

    let query = supabase
        .from('printer_monthly_stats')
        .select('year, month, print_only_delta, copy_delta, print_total_delta, printers!inner(unit_id)')
        .eq('printers.unit_id', unitId)
        .gte('year', targetYear);

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    // Aggregate in memory
    const aggregated = new Map<string, { year: number; month: number; print_only: number; copies: number; print_total: number }>();

    (data || []).forEach(row => {
        // Javascript Logical Filter:
        // Exclude months before targetMonth in the targetYear
        if (row.year === targetYear && row.month < targetMonth) {
            return;
        }

        const key = `${row.year}-${row.month}`;
        if (!aggregated.has(key)) {
            aggregated.set(key, { year: row.year, month: row.month, print_only: 0, copies: 0, print_total: 0 });
        }
        const item = aggregated.get(key)!;
        item.print_only += Number(row.print_only_delta) || 0;
        item.copies += Number(row.copy_delta) || 0;
        item.print_total += Number(row.print_total_delta) || 0;
    });

    // Convert to array and sort
    const result = Array.from(aggregated.values())
        .sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

    return result.map(item => new PrinterComparisonDto({
        year: item.year,
        month: item.month,
        print_only_delta: item.print_only,
        copy_delta: item.copies,
        print_total_delta: item.print_total
    }));
}
