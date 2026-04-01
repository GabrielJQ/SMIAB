import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface UnitHistoryRecord {
    year: number;
    month: number;
    print_total: number;
    print_only: number;
    copies: number;
}

const fetchUnitHistory = async (year: number, month: number): Promise<UnitHistoryRecord[]> => {
    const { data } = await api.get('/printers/unit/history', {
        params: { year, month }
    });
    return data;
};

export const useUnitHistory = (year: number, month: number) => {
    return useQuery({
        queryKey: ['unit-history', year, month],
        queryFn: () => fetchUnitHistory(year, month),
        staleTime: 5 * 60 * 1000,
    });
};
