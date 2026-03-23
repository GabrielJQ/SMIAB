import { SupabaseClient } from '@supabase/supabase-js';
import {
  applyTimestampRangeFilter,
  DateRangeFilter,
} from '../../../common/utils/supabase-query-helpers';

/**
 * @description Obtiene el historial de cambios de tóner para una impresora individual filtrado por un rango de fechas opcional.
 * Utiliza helpers comunes para aplicar filtros de marca temporal sobre la columna 'changed_at'.
 * 
 * @param {SupabaseClient} supabase - Cliente de Supabase.
 * @param {string} printerId - ID del activo (assetId) cuya historia se desea consultar.
 * @param {DateRangeFilter} params - Parámetros de filtrado que incluyen fecha de inicio (startDate) y fin (endDate).
 * @returns {Promise<any[]>} Arreglo de cambios de tóner para el activo solicitado.
 */
export async function getTonerHistoryByPrinterQuery(
  supabase: SupabaseClient,
  printerId: string,
  params: DateRangeFilter,
) {
  let query = supabase
    .from('printer_toner_changes')
    .select('*')
    .eq('asset_id', printerId);

  query = applyTimestampRangeFilter(query, 'changed_at', params);

  query = query.order('changed_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}

