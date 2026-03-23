import { SupabaseClient } from '@supabase/supabase-js';

/**
 * @description Obtiene todos los eventos de cambio de tóner asociados a una unidad sin agrupamiento.
 * Útil para listados genéricos y extracciones masivas donde no aplica un mes o año obligatorio.n la tabla de impresoras para filtrar por el identificador de unidad (unit_id).
 * Se utiliza principalmente para alimentar vistas de "Recientes" o auditoría rápida a nivel administrativo.
 * 
 * @param {SupabaseClient} supabase - Instancia del cliente de base de datos Supabase.
 * @param {string} unitId - Identificador único de la unidad administrativa (ej. UUID o ID numérico).
 * @param {number} [limit=50] - Cantidad máxima de registros a retornar (por defecto 50).
 * @returns {Promise<any[]>} Arreglo de registros de cambios de tóner ordenados de forma descendente por fecha.
 * @throws {Error} Si la consulta a Supabase retorna un error.
 */
export async function getTonerHistoryByUnitQuery(
  supabase: SupabaseClient,
  unitId: string,
  limit: number = 50,
) {
  // We need to join via printers -> areas -> units
  // supabase-js syntax for deep joins:
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
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

