import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface TopCombinedConsumer {
    printerId: string;
    name: string;
    status: string;
    impressions: number;
    tonerChanges: number;
}

/**
 * @hook useUnitTopCombined
 * @description Recupera las 5 impresoras con mayor volumen de impresión y su conteo de cambios de tóner
 * para el periodo actual en tiempo real.
 */
export function useUnitTopCombined() {
    return useQuery({
        queryKey: ['printers', 'top-combined'],
        queryFn: async () => {
            const { data } = await api.get<TopCombinedConsumer[]>('/printers/unit/top-combined');
            return data;
        },
        refetchInterval: 15 * 60 * 1000, // Refrescar cada 15 minutos (frecuencia de barrido SNMP)
        staleTime: 5 * 60 * 1000,
    });
}
