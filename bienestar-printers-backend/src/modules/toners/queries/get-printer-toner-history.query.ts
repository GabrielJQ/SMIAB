import { SupabaseClient } from '@supabase/supabase-js';

export async function getPrinterTonerHistoryQuery(
    supabase: SupabaseClient,
    printerId: string,
    months: number,
): Promise<{ year: number; month: number; toner_count: number }[]> {
    // Calculate target date
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1);

    const { data: changes, error } = await supabase
        .from('toner_changes')
        .select('changed_at')
        .eq('printer_id', printerId)
        .gte('changed_at', targetDate.toISOString());

    if (error) throw new Error(error.message);

    // Aggregate in memory
    const aggregated = new Map<string, { year: number; month: number; count: number }>();

    (changes || []).forEach(change => {
        const date = new Date(change.changed_at);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month}`;

        if (!aggregated.has(key)) {
            aggregated.set(key, { year, month, count: 0 });
        }
        aggregated.get(key)!.count++;
    });

    return Array.from(aggregated.values())
        .sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        })
        .map(item => ({
            year: item.year,
            month: item.month,
            toner_count: item.count
        }));
}
