import { SupabaseClient } from '@supabase/supabase-js';

export async function getPrintersByAreaQuery(
  supabase: SupabaseClient,
  areaId: string,
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
        areaname
      )
    `)
    .eq('area_id', areaId)
    .order('name_printer', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

