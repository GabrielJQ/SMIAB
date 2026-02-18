import { SupabaseClient } from '@supabase/supabase-js';

export async function getTonerHistoryByUnitQuery(
  supabase: SupabaseClient,
  unitId: string,
  limit: number = 50
) {
  // We need to join via printers -> areas -> units
  // supabase-js syntax for deep joins:
  const { data, error } = await supabase
    .from('printer_toner_changes')
    .select(`
      *,
      printers!inner (
        asset_id,
        name_printer,
        unit_id
      )
    `)
    .eq('printers.unit_id', unitId)
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}
