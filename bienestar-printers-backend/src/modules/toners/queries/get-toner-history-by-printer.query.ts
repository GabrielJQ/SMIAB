import { SupabaseClient } from '@supabase/supabase-js';
import { applyTimestampRangeFilter, DateRangeFilter } from '../../../common/utils/supabase-query-helpers';

export async function getTonerHistoryByPrinterQuery(
    supabase: SupabaseClient,
    printerId: string,
    params: DateRangeFilter
) {
    let query = supabase
        .from('toner_changes')
        .select('*')
        .eq('printer_id', printerId);

    query = applyTimestampRangeFilter(query, 'changed_at', params);

    query = query.order('changed_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
}
