import { SupabaseClient } from '@supabase/supabase-js';

export async function getTonerHistoryByUnitQuery(
    supabase: SupabaseClient,
    unitId: string,
    limit: number = 50
) {
    // We need to join via printers -> areas -> units
    // supabase-js syntax for deep joins:
    const { data, error } = await supabase
        .from('toner_changes')
        .select(`
      *,
      printers!inner (
        id,
        name_printer,
        areas!inner (
          id,
          unit_id
        )
      )
    `)
        .eq('printers.areas.unit_id', unitId)
        .order('changed_at', { ascending: false })
        .limit(limit);

    if (error) throw new Error(error.message);
    return data;
}
