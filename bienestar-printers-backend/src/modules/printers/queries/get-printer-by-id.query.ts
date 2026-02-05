import { SupabaseClient } from '@supabase/supabase-js';

export async function getPrinterByIdQuery(
  supabase: SupabaseClient,
  printerId: string,
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
        id,
        areaname,
        unit_id
      )
    `)
    .eq('id', printerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  return data;
}

