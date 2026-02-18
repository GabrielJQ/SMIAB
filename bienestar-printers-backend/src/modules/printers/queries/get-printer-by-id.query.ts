import { SupabaseClient } from '@supabase/supabase-js';

export async function getPrinterByIdQuery(
  supabase: SupabaseClient,
  printerId: string,
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
      last_read_at,
      department_id,
      unit_id,
      regions (
        regionname
      )
    `)
    .eq('asset_id', printerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

