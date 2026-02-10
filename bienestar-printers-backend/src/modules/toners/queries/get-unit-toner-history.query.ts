import { SupabaseClient } from '@supabase/supabase-js';

export async function getUnitTonerHistoryQuery(
    supabase: SupabaseClient,
    unitId: string,
    months: number,
): Promise<{ year: number; month: number; toner_count: number }[]> {
    // Phase 0: "Toner changes" might be logged in `toner_changes` table.
    // Logic: Count rows in `toner_changes` joined with `printers` filtered by `unit_id`.

    // Calculate target date
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1);

    // We need to query `toner_changes` linked to printers in this unit.
    // Supabase query:
    // SELECT count(*), year, month (extracted from changed_at)
    // FROM toner_changes
    // JOIN printers ON toner_changes.printer_id = printers.id
    // WHERE printers.unit_id = unitId AND changed_at >= targetDate

    // Since Supabase JS client doesn't do complex joins + aggregate easily:
    // 1. Fetch all printers in unit (cached/light query) -> get IDs
    // 2. Fetch all toner_changes for these IDs in range
    // 3. Aggregate in memory

    // Step 1: Get Printer IDs
    const { data: printers, error: printerError } = await supabase
        .from('printers')
        .select('id')
        .eq('unit_id', unitId);

    if (printerError) throw new Error(printerError.message);
    const printerIds = printers.map(p => p.id);

    if (printerIds.length === 0) return [];

    // Step 2: Fetch Changes
    const { data: changes, error: changesError } = await supabase
        .from('toner_changes')
        .select('changed_at')
        .in('printer_id', printerIds)
        .gte('changed_at', targetDate.toISOString());

    if (changesError) throw new Error(changesError.message);

    // Step 3: Aggregate
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
