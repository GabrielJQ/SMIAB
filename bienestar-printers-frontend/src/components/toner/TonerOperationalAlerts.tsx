"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterSummary } from '@/types/printer';
import { AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export const TonerOperationalAlerts = () => {
    const queryClient = useQueryClient();
    const [isConfirming, setIsConfirming] = useState<string | null>(null);

    // Fetch all printers for the unit
    const { data: printers, isLoading } = useQuery({
        queryKey: ['printers-unit'],
        queryFn: async () => {
            const { data } = await api.get<PrinterSummary[]>('/printers/unit');
            return data;
        }
    });

    // Mutation for manual toner change
    const mutation = useMutation({
        mutationFn: async (printerId: string) => {
            return api.post(`/printers/${printerId}/toner-change`);
        },
        onSuccess: () => {
            // Invalidate queries to refresh data across the app
            queryClient.invalidateQueries({ queryKey: ['printers-unit'] });
            queryClient.invalidateQueries({ queryKey: ['toners'] });
            setIsConfirming(null);
            toast.success('Cambio de tóner registrado exitosamente');
        },
        onError: (error) => {
            console.error('Error registering toner change:', error);
            toast.error('Error al registrar el cambio de tóner');
        }
    });

    // Filter printers with critical toner levels (<= 33%)
    const criticalPrinters = React.useMemo(() => {
        if (!printers) return [];
        return printers.filter(p => p.tonerLevel !== null && p.tonerLevel <= 33);
    }, [printers]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-guinda-700 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <DashboardCard className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-50/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest leading-none">
                                Alertas de Suministros
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Equipos con nivel crítico (33% o menos)
                            </p>
                        </div>
                    </div>
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl border border-red-100 font-black text-sm shadow-sm ring-1 ring-red-200/50">
                        {criticalPrinters.length} EQUIPOS EN RIESGO
                    </div>
                </div>

                <div className="relative z-10 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="pb-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Impresora / Estado</th>
                                <th className="pb-4 text-[10px] font-black tracking-widest text-slate-400 uppercase text-center w-32">Nivel</th>
                                <th className="pb-4 text-[10px] font-black tracking-widest text-slate-400 uppercase text-right px-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {criticalPrinters.length > 0 ? (
                                criticalPrinters.map((printer) => (
                                    <tr key={printer.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-2.5 h-2.5 rounded-full shadow-sm",
                                                    printer.isOnline ? "bg-emerald-500 shadow-emerald-500/20" : "bg-slate-300"
                                                )} />
                                                <div>
                                                    <div className="text-sm font-black text-slate-800 uppercase tracking-wider">
                                                        {printer.name}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                        {printer.area || 'Ubicación Desconocida'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 align-middle">
                                            <div className="flex justify-center">
                                                <div className={cn(
                                                    "px-3 py-1.5 rounded-xl font-black text-sm tracking-tighter flex items-center gap-2 border shadow-sm",
                                                    (printer.tonerLevel || 0) <= 15
                                                        ? "bg-red-50 text-red-600 border-red-100"
                                                        : "bg-amber-50 text-amber-600 border-amber-100"
                                                )}>
                                                    <Droplet className="w-3.5 h-3.5" />
                                                    {printer.tonerLevel}%
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 text-right px-4">
                                            {isConfirming === printer.id ? (
                                                <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-2">
                                                    <button
                                                        onClick={() => setIsConfirming(null)}
                                                        className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => mutation.mutate(printer.id)}
                                                        disabled={mutation.isPending}
                                                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex items-center gap-2 transform active:scale-95 transition-all"
                                                    >
                                                        {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                                        Confirmar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setIsConfirming(printer.id)}
                                                    className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-slate-300 hover:bg-slate-50 transition-all group-hover:shadow-sm"
                                                >
                                                    <RefreshCw className="w-3 h-3 text-slate-400" />
                                                    Cambio Manual
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40">
                                            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Sin alertas críticas</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Todos los suministros están en niveles óptimos</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </DashboardCard>

            <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-8 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Centro Operativo de Consumibles SMIAB &bull; Sistema de Gestión de Activos
                </p>
            </div>
        </div>
    );
};

const Droplet = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5s-3 3.5-3 5.5a7 7 0 0 0 7 7z" />
    </svg>
);
