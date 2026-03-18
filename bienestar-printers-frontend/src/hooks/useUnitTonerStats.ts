import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface TonerStatsDto {
    year: number;
    month: number;
    changes: number;
}

export const useUnitTonerStats = (year?: number, month?: number) => {
    // defaults if not provided
    const defaultYear = new Date().getFullYear();
    const defaultMonth = new Date().getMonth() + 1;

    const queryYear = year || defaultYear;
    const queryMonth = month || defaultMonth;

    return useQuery({
        queryKey: ['unit-toner-stats', queryYear, queryMonth],
        queryFn: async () => {
            const { data } = await api.get<TonerStatsDto[]>(`/printers/unit/toner-stats?year=${queryYear}&month=${queryMonth}`);
            return data;
        },
        select: (rawData) => {
            // Fill an array for the selected year, from Jan (1) up to the selected month
            const result = [];
            for (let m = 1; m <= queryMonth; m++) {
                const dbRecord = rawData.find((d: TonerStatsDto) => d.year === queryYear && d.month === m);
                result.push(dbRecord || { year: queryYear, month: m, changes: 0 });
            }
            return result;
        }
    });
};
