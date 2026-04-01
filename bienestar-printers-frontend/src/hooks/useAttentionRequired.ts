import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface AttentionRequiredPrinter {
    alertId: string;
    type: 'TONER_LOW' | 'PREMATURE_CHANGE' | 'SUSPICIOUS_SWAP';
    createdAt: string;
    metadata: {
        level?: number;
        oldLevel?: number;
        newLevel?: number;
        difference?: number;
        at: string;
    };
    printer: {
        id: string;
        name: string;
        ip: string;
        tonerLevel: number;
        area: string;
    };
}

/**
 * @hook useAttentionRequired
 * @description Recupera la lista de impresoras que requieren atención inmediata y permite resolver alertas.
 */
export function useAttentionRequired() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['printers', 'attention-required'],
        queryFn: async () => {
            const { data } = await api.get<AttentionRequiredPrinter[]>('/printers/unit/attention-required');
            return data;
        },
        refetchInterval: 5 * 60 * 1000, // Cada 5 minutos (es crítico)
    });

    const resolveMutation = useMutation({
        mutationFn: async (alertId: string) => {
            return api.post(`/printers/alerts/${alertId}/resolve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['printers', 'attention-required'] });
            queryClient.invalidateQueries({ queryKey: ['printers', 'status'] });
        },
    });

    return {
        ...query,
        resolveAlert: resolveMutation.mutateAsync,
        isResolving: resolveMutation.isPending,
    };
}
