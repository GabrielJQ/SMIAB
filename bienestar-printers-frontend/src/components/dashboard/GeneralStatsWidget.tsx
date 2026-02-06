"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterComparison } from '@/types/printer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Globe, Activity } from 'lucide-react';

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
        <div className="h-full bg-white rounded-3xl shadow-sm border-2 border-guinda-700/30 p-8 flex flex-col items-center justify-center font-bold text-slate-400 italic">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-400 rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-center">Consolidando<br />Datos Globales...</p>
        </div>
    );

    if (!history || history.length === 0) return (
        <div className="h-full bg-white rounded-3xl shadow-sm border-2 border-guinda-700/30 p-6 flex flex-col overflow-hidden items-center justify-center">
            <Globe className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Sin datos para el periodo</p>
        </div>
    );

    return (
        <div className="h-full bg-white rounded-3xl shadow-sm border-2 border-guinda-700/30 p-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-guinda-700" />
                        Producción Total
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 leading-none tracking-tighter">
                            {totalProduction.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {isCurrentMonthView ? 'Este Mes' : 'Acumulado'}
                        </span>
                    </div>
                </div>

                <div className="relative">
                    <select
                        value={range}
                        onChange={(e) => setRange(Number(e.target.value))}
                        className="appearance-none bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest rounded-xl hover:border-guinda-500 focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-600 block pl-3 pr-8 py-2 outline-none cursor-pointer transition-all shadow-sm"
                    >
                        <option value={1}>Mes Actual</option>
                        <option value={2}>Últimos 2 Meses</option>
                        <option value={3}>Últimos 3 Meses</option>
                        <option value={6}>Últimos 6 Meses</option>
                        <option value={12}>Último Año</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px] min-w-0 mt-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                        data={chartData}
                        margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                        barSize={isCurrentMonthView ? 50 : undefined}
                    >
                        <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                            width={40}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100">
                                            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">{data.fullName || data.name}</p>
                                            <p className="text-xl font-black text-slate-800" style={{ color: data.color }}>{data.value.toLocaleString()}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 6, 6]} animationDuration={1000}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
