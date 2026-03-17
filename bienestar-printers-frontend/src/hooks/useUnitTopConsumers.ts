import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface TonerChangeEvent {
    date: string;
    type: string;
}

export interface TopConsumer {
    assetId: string;
    printerName: string;
    areaName: string;
    toner_count: string | number;
    events: TonerChangeEvent[];
}

export function useUnitTopConsumers(year?: number, month?: number) {
    return useQuery({
        queryKey: ['toners', 'top-consumers', year, month],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (year) params.append('year', year.toString());
            if (month) params.append('month', month.toString());
            const querySeq = params.toString() ? `?${params.toString()}` : '';

            const { data } = await api.get<TopConsumer[]>(`/toners/unit/top-consumers${querySeq}`);
            return data;
        },
        refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
    });
}
