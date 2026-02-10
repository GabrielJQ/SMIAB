"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tonerService } from '@/services/tonerService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Droplet, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const COLORS = ['#7B1E34', '#0f172a', '#475569', '#cbd5e1', '#94a3b8', '#b91c1c', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2', '#2563eb'];

interface TonerUnitStatsWidgetProps {
    compact?: boolean;
}

export const TonerUnitStatsWidget: React.FC<TonerUnitStatsWidgetProps> = ({ compact = false }) => {
    const [range, setRange] = useState(1);

    const { data: history, isLoading } = useQuery({
        queryKey: ['toner-unit-history', range],
        queryFn: () => tonerService.getUnitHistory(range),
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

    if (isLoading) return (
        <div className={cn("h-full bg-white rounded-3xl shadow-sm border-2 border-guinda-700/15 flex items-center justify-center p-8", compact ? "min-h-[200px]" : "min-h-[300px]")}>
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-guinda-700 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando datos...</p>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-white rounded-3xl shadow-sm border-2 border-guinda-700/15 p-6 flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                        <Droplet className="w-4 h-4 text-guinda-700" />
                        Consumo Global de Tóner
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 leading-none tracking-tighter">
                            {totalConsumed.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Cartuchos
                        </span>
                    </div>
                </div>

                {!compact && (
                    <div className="relative z-10">
                        <select
                            value={range}
                            onChange={(e) => setRange(Number(e.target.value))}
                            className="appearance-none bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest rounded-xl hover:border-guinda-500 focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-600 block pl-3 pr-8 py-2 outline-none cursor-pointer transition-all shadow-sm"
                        >
                            <option value={1}>Mes Actual</option>
                            <option value={3}>3 Meses</option>
                            <option value={6}>6 Meses</option>
                            <option value={12}>1 Año</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <Calendar className="w-3 h-3" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 w-full min-h-[0] min-w-0">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
                            barSize={compact ? 30 : 50}
                        >
                            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                width={30}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100">
                                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">{data.fullName}</p>
                                                <p className="text-xl font-black text-slate-800" style={{ color: data.color }}>
                                                    {data.value} <span className="text-xs text-slate-400">unidades</span>
                                                </p>
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
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <Droplet className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Sin datos</p>
                    </div>
                )}
            </div>
        </div>
    );
};
