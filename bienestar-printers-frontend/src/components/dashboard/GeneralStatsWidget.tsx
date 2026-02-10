"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterComparison } from '@/types/printer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Globe } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { UnifiedFilter } from '@/components/dashboard/UnifiedFilter';

const fetchUnitHistory = async (months: number): Promise<PrinterComparison[]> => {
    // Uses the unit history endpoint which returns [ { year, month, printVolume }, ... ]
    const { data } = await api.get('/printers/unit/history', { params: { months } });
    return data;
};

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// --- COLORS ---
const COLORS = ['#7B1E34', '#0f172a', '#475569', '#cbd5e1', '#94a3b8', '#b91c1c', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2', '#2563eb'];

interface ChartData {
    name: string;
    value: number;
    color: string;
    fullName?: string;
}

export const GeneralStatsWidget = () => {
    const [range, setRange] = useState(1); // 1 = Current Month, >1 = History

    const { data: history, isLoading } = useQuery({
        queryKey: ['unit-history', range],
        queryFn: () => fetchUnitHistory(range),
    });

    // --- VIEW LOGIC ---

    const isCurrentMonthView = range === 1;
    let chartData: ChartData[] = [];
    let totalProduction = 0;

    if (history && history.length > 0) {
        if (isCurrentMonthView) {
            // VIEW 1: CURRENT MONTH UNIT STATS (3 BARS: Prints, Copies, Total)
            const currentStats = history[history.length - 1]; // Last item is most recent

            const prints = currentStats?.print_only ?? 0;
            const copies = currentStats?.copies ?? 0;
            const total = currentStats?.print_total ?? 0;

            chartData = [
                { name: 'IMPRESIONES', value: prints, color: '#7B1E34' },
                { name: 'COPIAS', value: copies, color: '#94a3b8' },
                { name: 'TOTAL UNIT', value: total, color: '#0f172a' },
            ];
            totalProduction = total;
        } else {
            // VIEW 2: HISTORICAL UNIT STATS (1 BAR PER MONTH)
            chartData = history.map((item, index) => ({
                name: `${MONTH_NAMES[item.month - 1]}`,
                fullName: `${MONTH_NAMES[item.month - 1]} ${item.year}`,
                value: item.print_total,
                // Cycle through palette
                color: COLORS[index % COLORS.length]
            }));

            // For historical range, usually sum of range is most impressive or useful
            totalProduction = history.reduce((acc, curr) => acc + curr.print_total, 0);
        }
    }

    if (isLoading) return (
        <DashboardCard className="flex flex-col items-center justify-center font-bold text-slate-400 italic">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-400 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-black uppercase tracking-[0.2em] leading-relaxed text-center">Consolidando<br />Datos Globales...</p>
        </DashboardCard>
    );

    if (!history || history.length === 0) return (
        <DashboardCard className="flex flex-col items-center justify-center">
            <Globe className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Sin datos disponibles</p>
        </DashboardCard>
    );

    return (
        <DashboardCard className="min-h-[400px]">
            {/* Decoration */}
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-slate-100/50 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
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
                                Documentos
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                {isCurrentMonthView ? 'Este Mes' : 'Acumulado'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <UnifiedFilter value={range} onChange={setRange} />
                </div>
            </div>

            <div className="w-full h-[350px] mt-4 relative z-10">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                        data={chartData}
                        margin={{ left: 0, right: 0, top: 10, bottom: 20 }}
                        barSize={isCurrentMonthView ? 60 : undefined}
                    >
                        <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                            width={40}
                            allowDecimals={false} // Ensure integers
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 ring-1 ring-slate-100/50">
                                            <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-wider">{data.fullName || data.name}</p>
                                            <p className="text-2xl font-black text-slate-800" style={{ color: data.color }}>{data.value.toLocaleString()}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" radius={[12, 12, 12, 12]} animationDuration={1500}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </DashboardCard>
    );
};
