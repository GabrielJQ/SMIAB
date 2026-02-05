"use client";

import React, { useState } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterComparison } from '@/types/printer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity } from 'lucide-react';

const fetchPrinterHistory = async (id: string, months: number): Promise<PrinterComparison[]> => {
    // Uses the comparison endpoint which returns [ { year, month, printVolume }, ... ] (sorted cronologically)
    const { data } = await api.get(`/printers/${id}/compare`, { params: { months } });
    return data;
};

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// --- COLORS ---
const COLORS = ['#7B1E34', '#0f172a', '#475569', '#cbd5e1', '#94a3b8', '#b91c1c', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2', '#2563eb'];

export const PrinterHistoryWidget = () => {
    const { selectedPrinterId, selectedPrinter } = useDashboardStore();
    const [range, setRange] = useState(1); // 1 = Current Month, >1 = History

    const { data: history, isLoading, isError } = useQuery({
        queryKey: ['printer-history', selectedPrinterId, range],
        queryFn: () => fetchPrinterHistory(selectedPrinterId!, range),
        enabled: !!selectedPrinterId,
    });

    if (!selectedPrinterId) return (
        <div className="h-full bg-white rounded-3xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-300">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Activity className="w-12 h-12 opacity-20" />
            </div>
            <p className="text-xl font-bold text-slate-400">Monitor de Producción</p>
            <p className="text-sm font-medium uppercase tracking-[0.2em] opacity-50 mt-2">Selecciona un equipo de impresión</p>
        </div>
    );

    if (isLoading) return (
        <div className="h-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-guinda-100 border-t-guinda-700 rounded-full animate-spin"></div>
                <p className="text-xs font-black text-slate-400 tracking-[0.3em]">CARGANDO HISTORIAL...</p>
            </div>
        </div>
    );

    if (isError || !history || history.length === 0) return (
        <div className="h-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex items-center justify-center">
            <p className="text-sm font-bold text-slate-400">Sin datos para el rango seleccionado</p>
        </div>
    );

    // --- VIEW LOGIC ---

    const isCurrentMonthView = range === 1;
    let chartData = [];
    // Default chart data type inference usually works, but defining explicit type if needed.
    // Standardizing to:
    /*
     interface ChartData {
        name: string;
        value: number;
        color: string;
        fullName?: string;
     }
    */
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
            color: COLORS[index % COLORS.length]
        }));
        totalProduction = history.reduce((acc, curr) => acc + curr.print_total, 0);
    }

    return (
        <div className="h-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Monitor de Historial
                        </h3>
                        <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-[9px] text-emerald-600 font-black border border-emerald-100 uppercase tracking-wide">Live</div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-black text-slate-900 leading-none tracking-tighter">
                            {totalProduction.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {isCurrentMonthView ? 'Este Mes' : 'Acumulado'}
                        </span>
                    </div>

                    <p className="text-[10px] font-bold text-slate-400">
                        <span className="uppercase tracking-widest shrink-0 text-slate-300">Impresora:</span>
                        <span className="text-slate-600 ml-1 uppercase">{selectedPrinter?.name}</span>
                    </p>
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

            <div className="flex-1 w-full min-h-[180px] min-w-0 mt-4">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                        data={chartData}
                        margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                        barSize={isCurrentMonthView ? 60 : undefined}
                    >
                        <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }}
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
                        <Bar dataKey="value" radius={[8, 8, 8, 8]} animationDuration={1000}>
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
