import { SupabaseClient } from '@supabase/supabase-js';

export async function getPrintersByUnitQuery(
  supabase: SupabaseClient,
  unitId: number,
) {
  // Nota: Buscamos impresoras donde su area tenga el unit_id solicitado
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
      areas!inner (
        id,
        areaname,
        unit_id
      )
    `)
    .eq('areas.unit_id', unitId)
    .order('name_printer', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
