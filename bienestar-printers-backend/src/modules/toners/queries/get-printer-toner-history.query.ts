import { SupabaseClient } from '@supabase/supabase-js';

export async function getPrinterTonerHistoryQuery(
    supabase: SupabaseClient,
    printerId: string,
    months: number,
): Promise<{ year: number; month: number; toner_count: number }[]> {
    // 1. Generate the strict list of months we want to show
    const monthsList: { year: number; month: number }[] = [];
    const today = new Date();
    // We want exactly 'months' entries, ending with current month
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        monthsList.push({
            year: d.getFullYear(),
            month: d.getMonth() + 1
        });
    }

    // Calculate target date (start of the first month in our list)
    const firstMonth = monthsList[0];
    const targetDate = new Date(firstMonth.year, firstMonth.month - 1, 1);

    const { data: changes, error } = await supabase
        .from('printer_toner_changes')
        .select('changed_at')
        .eq('asset_id', printerId)
        .gte('changed_at', targetDate.toISOString());

    if (error) throw new Error(error.message);

    // Aggregate in memory
    const aggregated = new Map<string, number>();

    (changes || []).forEach(change => {
        const date = new Date(change.changed_at);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month}`;

        const current = aggregated.get(key) || 0;
        aggregated.set(key, current + 1);
    });

    // Step 4: Map strictly to our months list
    return monthsList.map(item => {
        const key = `${item.year}-${item.month}`;
        return {
            year: item.year,
            month: item.month,
            toner_count: aggregated.get(key) || 0
        };
    });
}
