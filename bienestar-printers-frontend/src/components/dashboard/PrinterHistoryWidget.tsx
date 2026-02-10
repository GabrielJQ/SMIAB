"use client";

import React, { useState } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterComparison } from '@/types/printer';
import { Activity } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { UnifiedFilter } from '@/components/dashboard/UnifiedFilter';
import { BaseBarChart } from '@/components/ui/charts/BaseBarChart';
import { CHART_COLORS, MONTH_NAMES } from '@/lib/constants';

const fetchPrinterHistory = async (id: string, months: number): Promise<PrinterComparison[]> => {
    // Uses the comparison endpoint which returns [ { year, month, printVolume }, ... ] (sorted cronologically)
    const { data } = await api.get(`/printers/${id}/compare`, { params: { months } });
    return data;
};



export const PrinterHistoryWidget = () => {
    const { selectedPrinterId, selectedPrinter } = useDashboardStore();
    const [range, setRange] = useState(1); // 1 = Current Month, >1 = History

    const { data: history, isLoading, isError } = useQuery({
        queryKey: ['printer-history', selectedPrinterId, range],
        queryFn: () => fetchPrinterHistory(selectedPrinterId!, range),
        enabled: !!selectedPrinterId,
    });

    if (!selectedPrinterId) return (
        <DashboardCard className="flex flex-col items-center justify-center text-slate-300">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Activity className="w-12 h-12 opacity-20" />
            </div>
            <p className="text-xl font-bold text-slate-400">Monitor de Producción</p>
            <p className="text-sm font-medium uppercase tracking-[0.2em] opacity-50 mt-2">Selecciona un equipo de impresión</p>
        </DashboardCard>
    );

    if (isLoading) return (
        <DashboardCard className="flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-guinda-100 border-t-guinda-700 rounded-full animate-spin"></div>
                <p className="text-xs font-black text-slate-400 tracking-[0.3em]">CARGANDO HISTORIAL...</p>
            </div>
        </DashboardCard>
    );

    if (isError || !history || history.length === 0) return (
        <DashboardCard className="flex items-center justify-center">
            <p className="text-sm font-bold text-slate-400">Sin datos para el rango seleccionado</p>
        </DashboardCard>
    );

    // --- VIEW LOGIC ---

    const isCurrentMonthView = range === 1;
    let chartData = [];
    let totalProduction = 0;

    if (isCurrentMonthView) {
        // VIEW 1: CURRENT MONTH (3 BARS: Prints, Copies, Total)
        const currentStats = history[history.length - 1]; // Last item is most recent

        const prints = currentStats?.print_only ?? 0;
        const copies = currentStats?.copies ?? 0;
        const total = currentStats?.print_total ?? 0;

        chartData = [
            { name: 'IMPRESIONES', value: prints, color: '#7B1E34' },
            { name: 'COPIAS', value: copies, color: '#94a3b8' },
            { name: 'TOTAL', value: total, color: '#0f172a' },
        ];
        totalProduction = total;
    } else {
        // VIEW 2: HISTORICAL (1 BAR PER MONTH)
        chartData = history.map((item, index) => ({
            name: `${MONTH_NAMES[item.month - 1]}`,
            fullName: `${MONTH_NAMES[item.month - 1]} ${item.year}`,
            value: item.print_total, // Use Total from DB
            // Cycle through palette
            color: CHART_COLORS[index % CHART_COLORS.length]
        }));
        totalProduction = history.reduce((acc, curr) => acc + curr.print_total, 0);
    }

    return (
        <DashboardCard className="min-h-[400px]">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-slate-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 relative z-10 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-4 h-4 text-guinda-700" />
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Monitor de Historial
                        </h3>
                        <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-[9px] text-emerald-600 font-black border border-emerald-100 uppercase tracking-wide flex items-center gap-1">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            LIVE
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-black text-slate-900 leading-none tracking-tighter">
                            {totalProduction.toLocaleString()}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Documentos
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {isCurrentMonthView ? 'Este Mes' : 'Acumulado'}
                            </span>
                        </div>
                    </div>

                    <p className="text-[10px] font-bold text-slate-400">
                        <span className="uppercase tracking-widest shrink-0 text-slate-300">Impresora:</span>
                        <span className="text-slate-600 ml-1 uppercase">{selectedPrinter?.name}</span>
                    </p>
                </div>

                <div className="relative w-full md:w-auto">
                    <UnifiedFilter value={range} onChange={setRange} />
                </div>
            </div>

            <div className="w-full h-[300px] mt-4 relative z-10">
                <BaseBarChart
                    data={chartData}
                    dataKey="value"
                    barSize={isCurrentMonthView ? 60 : undefined}
                    tooltipContent={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 ring-1 ring-slate-100/50">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-wider">{data.fullName || data.name}</p>
                                    <p className="text-2xl font-black text-slate-800 flex items-baseline gap-1" style={{ color: data.color }}>
                                        {data.value.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold uppercase">Uds.</span>
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    }}
                >
                    <defs>
                        <linearGradient id="barGradientGuinda" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7B1E34" stopOpacity={1} />
                            <stop offset="100%" stopColor="#7B1E34" stopOpacity={0.6} />
                        </linearGradient>
                    </defs>
                </BaseBarChart>
            </div>
        </DashboardCard>
    );
};
