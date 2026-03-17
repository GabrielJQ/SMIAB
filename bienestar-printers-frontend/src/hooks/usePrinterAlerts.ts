import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface Alert {
    id: string;
    printerId: string;
    type: string; // 'PREMATURE_CHANGE' | 'SUSPICIOUS_SWAP' | 'TONER_LOW'
    status: string; // 'PENDING' | 'RESOLVED'
    createdAt: string;
    resolvedAt?: string | null;
    metadata?: {
        oldLevel: number;
        newLevel: number;
        difference: number;
        at: string;
    } | null;
}

export function usePrinterAlerts(printerId: string | undefined) {
    const queryClient = useQueryClient();

    // Fetch active alerts
    const alertsQuery = useQuery<Alert[]>({
        queryKey: ['printer-alerts', printerId],
        queryFn: async () => {
            if (!printerId) return [];
            const { data } = await api.get(`/printers/${printerId}/alerts`);
            return data;
        },
        enabled: Boolean(printerId),
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 min
    });

    // Resolve an alert
    const resolveAlertMutation = useMutation({
        mutationFn: async (alertId: string) => {
            const { data } = await api.post(`/printers/alerts/${alertId}/resolve`);
            return data;
        },
        onSuccess: () => {
            // Invalidate the alerts query so the banner disappears
            queryClient.invalidateQueries({ queryKey: ['printer-alerts', printerId] });
        },
    });

    return {
        ...alertsQuery,
        resolveAlert: resolveAlertMutation.mutateAsync,
        isResolving: resolveAlertMutation.isPending,
    };
}
