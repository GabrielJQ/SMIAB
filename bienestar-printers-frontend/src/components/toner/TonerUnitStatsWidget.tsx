"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUnitTonerStats } from '@/hooks/useUnitTonerStats';
import { Package, TrendingUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/components/ui/DashboardCard';
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

interface TonerUnitStatsWidgetProps {
    compact?: boolean;
}

export const TonerUnitStatsWidget: React.FC<TonerUnitStatsWidgetProps> = ({ compact = false }) => {
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    // Solicitamos datos del año seleccionado y del año anterior para la comparativa
    const { data: history, isLoading: isLoadingCurrent } = useUnitTonerStats(selectedYear, 12);
    const { data: prevHistory, isLoading: isLoadingPrev } = useUnitTonerStats(selectedYear - 1, 12);

    const isLoading = isLoadingCurrent || isLoadingPrev;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

    const chartData = React.useMemo(() => {
        if (!history) return [];
        return Array.from({ length: 12 }, (_, index) => {
            const iterMonth = index + 1;
            const dbRecord = history.find(d => d.month === iterMonth);
            const prevDbRecord = prevHistory?.find(d => d.month === iterMonth);
            
            const value = dbRecord ? dbRecord.changes : 0;
            const prevValue = prevDbRecord ? prevDbRecord.changes : 0;

            const prevMonthDbRecord = history.find(d => d.month === iterMonth - 1);
            const prevMonthValue = prevMonthDbRecord ? prevMonthDbRecord.changes : 0;
            let monthOverMonthDelta = 0;
            if (prevMonthValue > 0) {
                monthOverMonthDelta = ((value - prevMonthValue) / prevMonthValue) * 100;
            } else if (value > 0) {
                monthOverMonthDelta = 100;
            }

            return {
                name: `${MONTH_NAMES[index].substring(0, 3)}`,
                fullName: `${MONTH_NAMES[index]} ${selectedYear}`,
                prevFullName: `${MONTH_NAMES[index]} ${selectedYear - 1}`,
                value: value,
                prevValue: prevValue,
                monthOverMonthDelta: monthOverMonthDelta,
                color: CHART_COLORS[index % CHART_COLORS.length]
            };
        });
    }, [history, prevHistory, selectedYear]);

    const totalConsumed = React.useMemo(() => {
        return history?.reduce((acc, curr) => acc + curr.changes, 0) || 0;
    }, [history]);

    if (isLoading) return (
        <DashboardCard className={cn("flex items-center justify-center", compact ? "min-h-[200px]" : "min-h-[350px]")}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-guinda-700 rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Analizando...</p>
            </div>
        </DashboardCard>
    );

    return (
        <DashboardCard className="min-h-[400px] flex flex-col h-full">
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 relative z-10 gap-4 flex-none">
                <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-guinda-700" />
                        Consumo Histórico Global
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-slate-900 leading-none tracking-tighter">
                            {totalConsumed.toLocaleString()}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Cartuchos Totales
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-tight mt-0.5">
                                Acumulado del Año
                                <span className="text-emerald-500 font-black flex items-center gap-0.5 ml-1">
                                    <TrendingUp className="w-3 h-3" />
                                    +2.4%
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {!compact && (
                    <div className="relative group z-20 w-full md:w-auto mt-4 md:mt-0">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="appearance-none cursor-pointer bg-white border-2 border-slate-100 py-2.5 px-6 pr-10 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] shadow-sm transition-all duration-200 hover:border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200/50 outline-none"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors z-20">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full mt-4 relative z-10 flex-1 min-h-[300px]">
                {(!history || history.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <Package className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Sin datos registrados</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 20, right: 10, left: -20, bottom: 15 }}
                        >
                            <defs>
                                <linearGradient id="gradient_toner_premium_v2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7B1E34" stopOpacity={0.4} />
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
                                allowDecimals={false}
                                domain={[0, 'auto']}
                            />
                            <Tooltip
                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        
                                        let deltaColor = "bg-slate-100 text-slate-500 border-slate-200";
                                        let deltaIcon = "";
                                        let deltaText = "0%";
                                        if (data.monthOverMonthDelta > 0) {
                                            deltaColor = "bg-red-50 text-red-600 border-red-200";
                                            deltaIcon = "↑";
                                            deltaText = `+${data.monthOverMonthDelta.toFixed(1)}%`;
                                        } else if (data.monthOverMonthDelta < 0) {
                                            deltaColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
                                            deltaIcon = "↓";
                                            deltaText = `${data.monthOverMonthDelta.toFixed(1)}%`;
                                        }

                                        return (
                                            <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 ring-1 ring-slate-100/50 min-w-[160px]">
                                                <div className="flex justify-between items-center mb-3">
                                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider m-0">{MONTH_NAMES[chartData.findIndex(d => d.name === data.name)]}</p>
                                                    {data.monthOverMonthDelta !== 0 && (
                                                        <div className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${deltaColor}`}>
                                                            {deltaIcon} {deltaText} vs mes anterior
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex justify-between items-baseline gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-guinda-700" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedYear}</span>
                                                        </div>
                                                        <span className="text-lg font-black text-guinda-700">{data.value.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-baseline gap-4 pt-2 border-t border-slate-100">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedYear - 1}</span>
                                                        </div>
                                                        <span className="text-lg font-black text-slate-400">{data.prevValue.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="linear"
                                dataKey="value"
                                stroke="none"
                                fillOpacity={0.1}
                                fill="url(#gradient_toner_premium_v2)"
                                isAnimationActive={false}
                            />
                            <Line
                                type="linear"
                                dataKey="prevValue"
                                stroke="#cbd5e1"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={{ r: 4, fill: '#cbd5e1', stroke: '#fff', strokeWidth: 2 }}
                                isAnimationActive={false}
                            />
                            <Line
                                type="linear"
                                dataKey="value"
                                stroke="#7B1E34"
                                strokeWidth={4}
                                dot={{ fill: '#7B1E34', stroke: '#fff', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7, fill: '#7B1E34', stroke: '#fff', strokeWidth: 2 }}
                                isAnimationActive={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </DashboardCard>
    );
};
