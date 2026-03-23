"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterComparison } from '@/types/printer';
import { Globe, FileUp, ChevronDown, Download } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { BaseBarChart } from '@/components/ui/charts/BaseBarChart';
import { CHART_COLORS, MONTH_NAMES } from '@/lib/constants';
import { ImportHistoryModal } from './ImportHistoryModal';
import { useModalStore } from '@/store/useModalStore';
import { useExportModalStore } from '@/store/useExportModalStore';
import {
    ComposedChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const fetchUnitHistory = async (year: number): Promise<PrinterComparison[]> => {
    // We always request month 12 to get the full year history from the backend
    const { data } = await api.get('/printers/unit/history', { params: { year, month: 12 } });
    return data;
};

interface ChartData {
    name: string;
    value: number;
    color: string;
    fullName?: string;
    trendValue?: number;
}

export const GeneralStatsWidget = () => {
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const { openImportModal } = useModalStore();
    const { openExportModal } = useExportModalStore();

    const { data: history, isLoading, refetch } = useQuery({
        queryKey: ['unit-history', selectedYear],
        queryFn: () => fetchUnitHistory(selectedYear),
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

    // --- VIEW LOGIC ---

    let chartData: ChartData[] = [];
    let totalProduction = 0;

    if (history && history.length > 0) {
        // VIEW: HISTORICAL UNIT STATS (12 MONTHS COMPOSED CHART)
        const yearData = history.filter(d => d.year === selectedYear);

        // Generate strict 12-month array
        chartData = Array.from({ length: 12 }, (_, index) => {
            const iterMonth = index + 1;
            const dbRecord = yearData.find(d => d.month === iterMonth);
            const value = dbRecord ? (dbRecord.print_total ?? 0) : 0;

            return {
                name: `${MONTH_NAMES[index]}`,
                fullName: `${MONTH_NAMES[index]} ${selectedYear}`,
                value: value,
                trendValue: value > 0 ? value + (value * 0.05) : 0, // Visual trend line slightly above
                color: CHART_COLORS[index % CHART_COLORS.length]
            };
        });

        // Current Year Total (YTD or Full Year)
        totalProduction = chartData.reduce((acc, curr) => acc + curr.value, 0);
    }

    if (isLoading) return (
        <DashboardCard className="flex flex-col items-center justify-center font-bold text-slate-400 italic">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-400 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-black uppercase tracking-[0.2em] leading-relaxed text-center">Consolidando<br />Datos Globales...</p>
        </DashboardCard>
    );

    return (
        <DashboardCard className="min-h-[400px]">
            {/* Decoration */}
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-slate-100/50 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 relative z-10 gap-4">
                <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-guinda-700" />
                        Producción Total
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-slate-900 leading-none tracking-tighter">
                            {totalProduction.toLocaleString()}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Documentos Totales
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                Acumulado del Año
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative w-full md:w-auto self-end md:self-auto">
                    <button 
                        onClick={() => openExportModal()}
                        className="flex items-center gap-2 bg-guinda-50 hover:bg-guinda-100 text-guinda-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                    >
                        <Download className="w-4 h-4 text-guinda-700" />
                        Exportar Reporte
                    </button>

                    <button 
                        onClick={() => openImportModal(() => refetch())}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
                    >
                        <FileUp className="w-4 h-4 text-guinda-700" />
                        Importar Historial
                    </button>
                    
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

            <div className="w-full h-[350px] mt-4 relative z-10 flex-1">
                {(!history || history.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <Globe className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Sin datos disponibles</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7B1E34" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#7B1E34" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 ring-1 ring-slate-100/50">
                                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-wider">{data.fullName}</p>
                                                <p className="text-2xl font-black text-guinda-700">{data.value.toLocaleString()}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="none"
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                activeDot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="trendValue"
                                stroke="#7B1E34"
                                strokeWidth={3}
                                dot={{ fill: '#fff', stroke: '#7B1E34', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#7B1E34', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </DashboardCard>
    );
};
