import { SupabaseClient } from '@supabase/supabase-js';

export async function getUnitByAreaQuery(
    supabase: SupabaseClient,
    areaId: string,
) {
    const { data, error } = await supabase
        .from('areas')
        .select('unit_id')
        .eq('id', areaId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data?.unit_id ?? null;
}
