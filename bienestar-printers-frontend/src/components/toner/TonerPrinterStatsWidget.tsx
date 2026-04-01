"use client";

import React, { useState } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useQuery } from '@tanstack/react-query';
import { tonerService } from '@/services/tonerService';
import { Printer, Calendar, Activity, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { BaseBarChart } from '@/components/ui/charts/BaseBarChart';
import { CHART_COLORS, MONTH_NAMES } from '@/lib/constants';

export const TonerPrinterStatsWidget = () => {
    const { selectedPrinterId, selectedPrinter } = useDashboardStore();
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    // Fetch full year history (month 12)
    const { data: history, isLoading } = useQuery({
        queryKey: ['toner-printer-history', selectedPrinterId, selectedYear],
        queryFn: () => tonerService.getPrinterHistory(selectedPrinterId!, selectedYear, 12),
        enabled: !!selectedPrinterId,
    });

    const chartData = React.useMemo(() => {
        // Generate 12 months for the selected year
        return Array.from({ length: 12 }, (_, index) => {
            const iterMonth = index + 1;
            const dbRecord = history?.find(d => d.month === iterMonth);
            const value = dbRecord ? dbRecord.toner_count : 0;
            
            return {
                name: `${MONTH_NAMES[index].substring(0, 3)}`,
                fullName: `${MONTH_NAMES[index]} ${selectedYear}`,
                value: value,
                color: CHART_COLORS[index % CHART_COLORS.length]
            };
        });
    }, [history, selectedYear]);

    const totalConsumed = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.value, 0);
    }, [chartData]);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

    if (!selectedPrinterId) return (
        <DashboardCard className="flex flex-col items-center justify-center text-slate-300 min-h-[400px]">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Printer className="w-12 h-12 opacity-20" />
            </div>
            <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">Detalle por Equipo</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50 mt-2">Selecciona una impresora en la lista</p>
        </DashboardCard>
    );

    if (isLoading) return (
        <DashboardCard className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-guinda-700 rounded-full animate-spin"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Consultando Historial...</p>
            </div>
        </DashboardCard>
    );

    return (
        <DashboardCard className="min-h-[400px] flex flex-col overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-slate-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 relative z-10 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-4 h-4 text-guinda-700" />
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Monitor de Consumo Individual
                        </h3>
                        <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-[9px] text-emerald-600 font-bold border border-emerald-100 uppercase tracking-wide flex items-center gap-1">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            LIVE
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold text-slate-900 leading-none tracking-tighter">
                            {totalConsumed.toLocaleString()}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Cartuchos
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase">
                                Acumulado del Año
                            </span>
                        </div>
                    </div>

                    <p className="text-[10px] font-bold text-slate-400">
                        <span className="uppercase tracking-widest shrink-0 text-slate-300">Impresora:</span>
                        <span className="text-slate-600 ml-1 uppercase">{selectedPrinter?.name}</span>
                    </p>
                </div>

                <div className="relative w-full md:w-auto">
                    <div className="relative group">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="appearance-none cursor-pointer bg-white border-2 border-guinda-700/10 py-2.5 px-6 pr-10 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] shadow-sm transition-all duration-200 hover:border-guinda-700/30 hover:bg-guinda-50/30 focus:outline-none focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-guinda-700 group-hover:text-guinda-800 transition-colors z-20">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px] mt-4 relative z-10">
                {chartData.some(d => d.value > 0) ? (
                    <BaseBarChart
                        data={chartData}
                        dataKey="value"
                        barSize={50}
                        tooltipContent={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 ring-1 ring-slate-100/50">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">{data.fullName}</p>
                                        <p className="text-2xl font-bold text-guinda-700">
                                            {data.value} <span className="text-[10px] text-slate-400 font-bold uppercase">Uds.</span>
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    >
                        <defs>
                            <linearGradient id="barGradientPrinter" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7B1E34" stopOpacity={1} />
                                <stop offset="100%" stopColor="#7B1E34" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>
                    </BaseBarChart>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <Activity className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Sin reemplazos registrados en {selectedYear}</p>
                    </div>
                )}
            </div>
        </DashboardCard>
    );
};
