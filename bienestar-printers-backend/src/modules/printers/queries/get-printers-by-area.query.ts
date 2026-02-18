import { SupabaseClient } from '@supabase/supabase-js';

export async function getPrintersByAreaQuery(
  supabase: SupabaseClient,
  areaId: string,
) {
  const { data, error } = await supabase
    .from('printers')
    .select(`
      asset_id,
      name_printer,
      printer_status,
      toner_lvl,
      kit_mttnce_lvl,
      uni_img_lvl,
      last_read_at
    `)
    .eq('department_id', areaId)
    .order('name_printer', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

