import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface TonerStatsDto {
    year: number;
    month: number;
    changes: number;
}

export const useUnitTonerStats = (months: number = 12) => {
    return useQuery({
        queryKey: ['unit-toner-stats', months],
        queryFn: async () => {
            const { data } = await api.get<TonerStatsDto[]>(`/printers/unit/toner-stats?months=${months}`);
            return data;
        },
        select: (rawData) => {
            // Generar los últimos N meses para que no haya saltos
            const result = [];
            let currentDate = new Date();
            for (let i = months - 1; i >= 0; i--) {
                const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                const year = targetDate.getFullYear();
                const month = targetDate.getMonth() + 1;

                const dbRecord = rawData.find((d: TonerStatsDto) => d.year === year && d.month === month);
                result.push(dbRecord || { year, month, changes: 0 });
            }
            return result;
        }
    });
};
