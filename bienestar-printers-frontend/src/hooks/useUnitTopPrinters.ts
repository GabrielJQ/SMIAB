import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface TopPrinterConsumer {
    printerId: string;
    name: string;
    totalImpressions: number;
}

const fetchUnitTopPrinters = async (year: number, month: number): Promise<TopPrinterConsumer[]> => {
    const { data } = await api.get('/printers/unit/top-consumers', {
        params: { year, month }
    });
    return data;
};

export const useUnitTopPrinters = (year: number, month: number) => {
    return useQuery({
        queryKey: ['unit-top-printers', year, month],
        queryFn: () => fetchUnitTopPrinters(year, month),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
