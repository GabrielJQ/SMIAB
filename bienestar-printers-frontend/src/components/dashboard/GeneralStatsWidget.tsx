"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterComparison } from '@/types/printer';
import { Globe } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { MonthYearFilter } from '@/components/dashboard/MonthYearFilter';
import { BaseBarChart } from '@/components/ui/charts/BaseBarChart';
import { CHART_COLORS, MONTH_NAMES } from '@/lib/constants';
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

const fetchUnitHistory = async (year: number, month: number): Promise<PrinterComparison[]> => {
    // Uses the unit history endpoint which returns [ { year, month, printVolume }, ... ]
    const { data } = await api.get('/printers/unit/history', { params: { year, month } });
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
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

    const { data: history, isLoading } = useQuery({
        queryKey: ['unit-history', selectedYear, selectedMonth],
        queryFn: () => fetchUnitHistory(selectedYear, selectedMonth),
    });

    // --- VIEW LOGIC ---

    let chartData: ChartData[] = [];
    let totalProduction = 0;

    if (history && history.length > 0) {
        // VIEW 2: HISTORICAL UNIT STATS (12 MONTHS COMPOSED CHART)
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

        // For historical range, cap at selected month
        const slicedHistory = chartData.slice(0, selectedMonth);
        totalProduction = slicedHistory.reduce((acc, curr) => acc + curr.value, 0);
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

                <div className="relative w-full md:w-auto">
                    <MonthYearFilter 
                        month={selectedMonth}
                        year={selectedYear}
                        onMonthChange={setSelectedMonth}
                        onYearChange={setSelectedYear}
                    />
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
