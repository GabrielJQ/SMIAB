
export interface DateRangeFilter {
    startYear?: number;
    startMonth?: number;
    endYear?: number;
    endMonth?: number;
}

/**
 * Applies a date range filter to a Supabase query builder.
 * Assumes the table has 'year' and 'month' columns.
 * 
 * Logic:
 * Start: (year > startYear) OR (year = startYear AND month >= startMonth)
 * End:   (year < endYear)   OR (year = endYear   AND month <= endMonth)
 * 
 * Note: Supabase .or() applies the filter as an additional condition. 
 * Since default behavior is AND, calling .or() twice results in (C1) AND (C2), which is correct.
 */
export const applyDateRangeFilter = (query: any, filters: DateRangeFilter) => {
    let q = query;

    if (filters.startYear) {
        if (filters.startMonth) {
            // Complex filter for Start Date
            const filter = `year.gt.${filters.startYear},and(year.eq.${filters.startYear},month.gte.${filters.startMonth})`;
            q = q.or(filter);
        } else {
            // Simple filter for Start Year
            q = q.gte('year', filters.startYear);
        }
    }

    if (filters.endYear) {
        if (filters.endMonth) {
            // Complex filter for End Date
            const filter = `year.lt.${filters.endYear},and(year.eq.${filters.endYear},month.lte.${filters.endMonth})`;
            q = q.or(filter);
        } else {
            // Simple filter for End Year
            q = q.lte('year', filters.endYear);
        }
    }

    return q;
};

/**
 * Applies a date range filter to a Supabase query builder for 'changed_at' or similar timestamp column.
 * Assumes params may have startYear/Month/endYear/Month.
 */
export const applyTimestampRangeFilter = (query: any, column: string, filters: DateRangeFilter) => {
    let q = query;

    if (filters.startYear) {
        const startMonth = filters.startMonth || 1;
        const startDate = new Date(filters.startYear, startMonth - 1, 1).toISOString();
        q = q.gte(column, startDate);
    }

    if (filters.endYear) {
        const endMonth = filters.endMonth || 12;
        // Last day of month logic: day 0 of next month
        const endDate = new Date(filters.endYear, endMonth, 0, 23, 59, 59).toISOString();
        q = q.lte(column, endDate);
    }

    return q;
};
