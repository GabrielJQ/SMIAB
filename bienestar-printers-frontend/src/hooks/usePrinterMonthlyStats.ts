import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterChartData } from '@/types/printer';

export const usePrinterMonthlyStats = (printerId: string | null, currentYear: number) => {
    return useQuery({
        queryKey: ['printer-monthly-stats', printerId, currentYear],
        queryFn: async () => {
            const { data } = await api.get<PrinterChartData[]>(`/printers/${printerId}/monthly-stats`);
            return data;
        },
        select: (rawData) => {
            // Filtramos los datos brutos solo por el año que Recharts va a dibujar
            const yearData = rawData.filter(d => d.year === currentYear);

            // Generamos un Array estricto de [1 al 12] que garantiza que siempre habrá 12 puntos en la gráfica (evita saltos en Recharts)
            const fullYearData: PrinterChartData[] = Array.from({ length: 12 }, (_, index) => {
                const iterMonth = index + 1;
                const dbRecord = yearData.find(d => d.month === iterMonth);

                return dbRecord ? dbRecord : {
                    year: currentYear,
                    month: iterMonth,
                    totalImpressions: 0,
                    printOnly: 0,
                    copies: 0,
                    tonerChanges: 0,
                };
            });

            return fullYearData;
        },
        enabled: !!printerId, // Evitar mandar la query si aún no tenemos el ID
    });
};
