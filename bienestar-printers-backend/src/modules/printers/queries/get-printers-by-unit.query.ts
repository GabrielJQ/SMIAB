import { SupabaseClient } from '@supabase/supabase-js';

export async function getPrintersByUnitQuery(
  supabase: SupabaseClient,
  unitId: number,
) {
  // Nota: Buscamos impresoras donde su area tenga el unit_id solicitado
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
    .eq('unit_id', unitId)
    .order('name_printer', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
