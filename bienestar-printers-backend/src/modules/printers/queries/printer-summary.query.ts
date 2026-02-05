import { SupabaseClient } from '@supabase/supabase-js';

export async function getPrinterSummaryQuery(
  supabase: SupabaseClient,
  unitId: string,
) {
  const { data, error } = await supabase
    .from('printers')
    .select(`
      id,
      name_printer,
      printer_status,
      toner_lvl,
      kit_mttnce,
      uni_img,
      created_at,
      areas (
        name,
        unit_id
      )
    `)
    .eq('areas.unit_id', unitId)
    .order('name_printer', { ascending: true });

  if (error) {
    throw new Error(`Error fetching printers summary: ${error.message}`);
  }

  return data;
}
