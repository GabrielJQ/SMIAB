import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface TopCombinedConsumer {
    printerId: string;
    name: string;
    status: string;
    impressions: number;
    tonerChanges: number;
}

export interface TopCombinedResponse {
    periodLabel: string;
    data: TopCombinedConsumer[];
}

/**
 * @hook useUnitTopCombined
 * @description Recupera las 5 impresoras con mayor consumo consolidado del mes anterior.
 */
export function useUnitTopCombined() {
    return useQuery({
        queryKey: ['printers', 'top-combined'],
        queryFn: async () => {
            const { data } = await api.get<TopCombinedResponse>('/printers/unit/top-combined');
            return data;
        },
        refetchInterval: 60 * 60 * 1000, // Refrescar cada hora (mes anterior es estático)
        staleTime: 30 * 60 * 1000,
    });
}
