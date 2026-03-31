"use client";

import React, { useState } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { usePrinterMonthlyStats } from '@/hooks/usePrinterMonthlyStats';
import { Activity, ChevronDown } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { BaseBarChart } from '@/components/ui/charts/BaseBarChart';
import { CHART_COLORS, MONTH_NAMES } from '@/lib/constants';
import { Bar } from 'recharts';

export const PrinterHistoryWidget = () => {
    const { selectedPrinterId, selectedPrinter } = useDashboardStore();
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    const { data: history = [], isLoading, isError } = usePrinterMonthlyStats(selectedPrinterId, selectedYear);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

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

    // --- VIEW LOGIC ---
    let chartData = [];
    let totalProduction = 0;

    // VIEW: HISTORICAL (Full Year)
    chartData = history.map((item, index) => ({
        name: `${MONTH_NAMES[item.month - 1]}`,
        fullName: `${MONTH_NAMES[item.month - 1]} ${item.year}`,
        value: item.totalImpressions,
        impresiones: item.printOnly,
        copias: item.copies,
        color: CHART_COLORS[index % CHART_COLORS.length]
    }));
    
    totalProduction = history.reduce((acc, curr) => acc + curr.totalImpressions, 0);

    return (
        <DashboardCard className="min-h-[400px] h-full flex flex-col">
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
                    {/* Year Selector Only */}
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

            <div className="w-full mt-4 relative z-10 flex-1 min-h-[300px]">
                {(!history || history.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <Activity className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Sin datos disponibles</p>
                    </div>
                ) : (
                    <BaseBarChart
                        data={chartData}
                        dataKey={undefined as any}
                        barSize={45}
                        tooltipContent={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 ring-1 ring-slate-100/50">
                                        <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-wider">{data.fullName || data.name}</p>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-2xl font-black text-slate-800 flex items-baseline gap-1">
                                                {data.value.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold uppercase">Uds. Totales</span>
                                            </p>
                                            <div className="flex gap-4 mt-1 border-t border-slate-100 pt-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-[#881337]"></div>
                                                    <span className="text-xs font-bold text-slate-600">Imp: {data.impresiones.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-[#cbd5e1]"></div>
                                                    <span className="text-xs font-bold text-slate-600">Cop: {data.copias.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    >
                        <Bar dataKey="impresiones" stackId="a" fill="#881337" />
                        <Bar dataKey="copias" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                        <defs>
                            <linearGradient id="barGradientGuinda" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7B1E34" stopOpacity={1} />
                                <stop offset="100%" stopColor="#7B1E34" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>
                    </BaseBarChart>
                )}
            </div>
        </DashboardCard>
    );
};
