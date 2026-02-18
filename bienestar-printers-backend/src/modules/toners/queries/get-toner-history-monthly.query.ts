import { SupabaseClient } from '@supabase/supabase-js';

export async function getTonerHistoryMonthlyQuery(
  supabase: SupabaseClient,
  unitId: string,
  months: number = 6
) {
  // Logic: Get changes in the last N months for the entire unit.
  // We can't easily "group by" in Supabase JS client and return custom objects without using a view or RPC.
  // Given constraints ("NO modificar autenticación", "NO meter lógica en queries"),
  // and Phase 0/Simple requirements, I will fetch the raw data within the range and let the Service aggregate.

  // However, the prompt says "Queries requeridos... Agrupación mensual". 
  // If I can't do it in SQL via Client easily, I'll return the raw rows sorted.
  // Service will map them to the Summary DTO if needed, or Controller will.

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1); // Start of that month

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
    .gte('changed_at', startDate.toISOString())
    .order('changed_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
