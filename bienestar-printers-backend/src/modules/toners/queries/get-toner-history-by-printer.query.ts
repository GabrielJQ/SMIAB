import { SupabaseClient } from '@supabase/supabase-js';

export async function getTonerHistoryByPrinterQuery(
    supabase: SupabaseClient,
    printerId: string,
    startYear?: number,
    startMonth?: number,
    endYear?: number,
    endMonth?: number
) {
    let query = supabase
        .from('toner_changes')
        .select('*')
        .eq('printer_id', printerId)
        .order('changed_at', { ascending: false });

    if (startYear) {
        const startDate = new Date(startYear, (startMonth || 1) - 1, 1).toISOString();
        query = query.gte('changed_at', startDate);
    }

    if (endYear) {
        // End of the month logic could be complex without moment/date-fns, keeping it simple:
        // If endMonth is provided, go to next month day 0. If not, end of year.
        const nextMonth = endMonth ? endMonth : 12; // If no month, take whole year? Or just start logic?
        // Let's rely on standard ISO string comparison.
        // Ideally we pass full dates from service, but the DTO has separate fields.
        // I'll construct a safe "end" date.

        // Simplification for now: User passes params, we build filter.
        // Better strategy: construct filters in Service, pass simple date strings to Query?
        // Maintaining pattern: logic in Query function as seen in printers?
        // Printer queries didn't show complex date logic.
        // I will implement basic ISO filters here.

        // Actually, let's keep it simple: params are optional.
        const endDateYear = endYear;
        const endDateMonth = endMonth || 12;
        // Get last day of that month
        const endDate = new Date(endDateYear, endDateMonth, 0, 23, 59, 59).toISOString();
        query = query.lte('changed_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
}
