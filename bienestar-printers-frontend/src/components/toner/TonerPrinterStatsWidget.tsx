"use client";

import React, { useState } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useQuery } from '@tanstack/react-query';
import { tonerService } from '@/services/tonerService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Printer, Calendar, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedFilter } from '@/components/dashboard/UnifiedFilter';
import { DashboardCard } from '@/components/ui/DashboardCard';

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
// Reuse same palette for consistency
const COLORS = ['#7B1E34', '#0f172a', '#475569', '#cbd5e1', '#94a3b8', '#b91c1c', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2', '#2563eb'];

export const TonerPrinterStatsWidget = () => {
    const { selectedPrinterId, selectedPrinter } = useDashboardStore();
    const [range, setRange] = useState(1);

    const { data: history, isLoading } = useQuery({
        queryKey: ['toner-printer-history', selectedPrinterId, range],
        queryFn: () => tonerService.getPrinterHistory(selectedPrinterId!, range),
        enabled: !!selectedPrinterId,
    });

    const chartData = React.useMemo(() => {
        if (!history) return [];
        return history.map((item, index) => ({
            name: `${MONTH_NAMES[item.month - 1]}`,
            fullName: `${MONTH_NAMES[item.month - 1]} ${item.year}`,
            value: item.toner_count,
            color: COLORS[index % COLORS.length]
        }));
    }, [history]);

    const totalConsumed = React.useMemo(() => {
        return history?.reduce((acc, curr) => acc + curr.toner_count, 0) || 0;
    }, [history]);

    if (!selectedPrinterId) return (
        <DashboardCard className="flex flex-col items-center justify-center text-slate-300 min-h-[300px] transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Printer className="w-12 h-12 opacity-20" />
            </div>
            <p className="text-xl font-bold text-slate-400">Detalle por Equipo</p>
            <p className="text-sm font-medium uppercase tracking-[0.2em] opacity-50 mt-2">Selecciona una impresora</p>
        </DashboardCard>
    );

    if (isLoading) return (
        <DashboardCard className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-guinda-700 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando...</p>
            </div>
        </DashboardCard>
    );

    return (
        <DashboardCard className="p-6 flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 relative z-10 gap-4">
                <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Printer className="w-4 h-4 text-guinda-700" />
                        Historial: {selectedPrinter?.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 leading-none tracking-tighter">
                            {totalConsumed.toLocaleString()}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                Cartuchos
                            </span>
                        </div>
                    </div>
                </div>

                <div className="relative z-20 w-full md:w-auto">
                    <UnifiedFilter value={range} onChange={setRange} />
                </div>
            </div>

            <div className="flex-1 w-full min-h-[0] min-w-0 mt-4 relative z-10">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ left: 0, right: 0, top: 10, bottom: 20 }}
                            barSize={50}
                        >
                            <defs>
                                <linearGradient id="barGradientPrinter" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#7B1E34" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#7B1E34" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
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
                                width={30}
                                allowDecimals={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 ring-1 ring-slate-100/50">
                                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-wider">{data.fullName}</p>
                                                <p className="text-2xl font-black text-slate-800 flex items-baseline gap-1" style={{ color: data.color }}>
                                                    {data.value} <span className="text-[10px] text-slate-400 font-bold uppercase">Uds.</span>
                                                </p>
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
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <Activity className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Sin historial reciente</p>
                    </div>
                )}
            </div>
        </DashboardCard>
    );
};
