import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface OperationalStatusData {
    total: number;
    online: number;
    offline: number;
}

const fetchOperationalStatus = async (): Promise<OperationalStatusData> => {
    const { data } = await api.get('/printers/unit/status');
    return data;
};

export const useOperationalStatus = () => {
    return useQuery({
        queryKey: ['operational-status'],
        queryFn: fetchOperationalStatus,
        refetchInterval: 30000, // Refetch every 30 seconds as requested
        staleTime: 10000, // Consider data stale after 10s
    });
};
