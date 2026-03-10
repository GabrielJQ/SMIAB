import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface TopConsumer {
    assetId: string;
    printerName: string;
    areaName: string;
    toner_count: string | number;
}

export function useUnitTopConsumers() {
    return useQuery({
        queryKey: ['toners', 'top-consumers'],
        queryFn: async () => {
            const { data } = await api.get<TopConsumer[]>('/toners/unit/top-consumers');
            return data;
        },
        refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
    });
}
