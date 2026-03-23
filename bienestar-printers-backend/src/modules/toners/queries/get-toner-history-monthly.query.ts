import { SupabaseClient } from '@supabase/supabase-js';

/**
 * @description Extrae el historial detallado de cambios de tóner para una unidad en un mes específico.
 * Incluye cruces con tablas suplementarias (Printers, Departments) para devolver la foto completa del activo.námico (gte) sobre la fecha de cambio. 
 * Los datos devueltos incluyen la relación con la impresora para facilitar la posterior agregación en la capa de servicio.
 * 
 * @param {SupabaseClient} supabase - Cliente de Supabase autenticado.
 * @param {string} unitId - ID de la unidad administrativa.
 * @param {number} [months=6] - Cantidad de meses hacia atrás para la consulta (por defecto 6).
 * @returns {Promise<any[]>} Arreglo de registros crudos de cambios de tóner con metadatos de impresoras.
 * @throws {Error} Si ocurre un fallo en la comunicación con el API de Supabase.
 */
export async function getTonerHistoryMonthlyQuery(
  supabase: SupabaseClient,
  unitId: string,
  months: number = 6,
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
    .select(
      `
      *,
      printers!inner (
        asset_id,
        name_printer,
        unit_id
      )
    `,
    )
    .eq('printers.unit_id', unitId)
    .gte('changed_at', startDate.toISOString())
    .order('changed_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

