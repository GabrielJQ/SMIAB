"use client";

import React, { useState } from 'react';
import { useUnitTonerStats } from '@/hooks/useUnitTonerStats';
import { useUnitTopConsumers } from '@/hooks/useUnitTopConsumers';
import { TonerPrinterStatsWidget } from '@/components/toner/TonerPrinterStatsWidget';
import {
    Droplet,
    TrendingUp,
    Calendar,
    ChevronDown,
    ChevronUp,
    PackageOpen,
    Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { MonthYearFilter } from '@/components/dashboard/MonthYearFilter';
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

export const TonerManagementReport = () => {
    const now = new Date();

    // Unified Selectors ( matching Statistics style)
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Fetch data using unified year/month
    const { data: history, isLoading: isHistoryLoading } = useUnitTonerStats(selectedYear, selectedMonth);
    const { data: topConsumers, isLoading: isConsumersLoading } = useUnitTopConsumers(selectedYear, selectedMonth);

    const chartData = React.useMemo(() => {
        if (!history) return [];
        // Generate 12 months for the selected year
        return Array.from({ length: 12 }, (_, index) => {
            const iterMonth = index + 1;
            const dbRecord = history.find(d => d.month === iterMonth && d.year === selectedYear);
            const value = dbRecord ? dbRecord.changes : 0;

            return {
                name: `${MONTH_NAMES[index].substring(0, 3)}`,
                fullName: `${MONTH_NAMES[index]} ${selectedYear}`,
                value: value,
                trendValue: value > 0 ? value + (value * 0.1) : 0, // Visual trend line
                color: CHART_COLORS[index % CHART_COLORS.length]
            };
        });
    }, [history, selectedYear]);

    const totalConsumed = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.value, 0);
    }, [chartData]);

    // KPI Data for current month
    const currentMonthCons = topConsumers?.reduce((acc, curr) => acc + Number(curr.toner_count), 0) || 0;
    const maxCons = topConsumers && topConsumers.length > 0 ? Number(topConsumers[0].toner_count) : 0;

    if (isHistoryLoading || isConsumersLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-guinda-700 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-full">
            {/* Left Column (Charts) - Span 2 */}
            <div className="lg:col-span-2 flex flex-col gap-6">

                {/* Global Consumption Chart */}
                <DashboardCard className="min-h-[400px] flex flex-col">
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-slate-100/50 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 relative z-10 gap-4">
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
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                        Acumulado del Año
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 relative z-20">
                            {/* Unified Year Selector style */}
                            <div className="relative group">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="appearance-none cursor-pointer bg-white border-2 border-guinda-700/10 py-2 px-6 pr-10 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] shadow-sm transition-all duration-200 hover:border-guinda-700/30 hover:bg-guinda-50/30 focus:outline-none focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 outline-none"
                                >
                                    {[2024, 2025, 2026].map(y => (
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
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={chartData}
                                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorToner" x1="0" y1="0" x2="0" y2="1">
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
                                />
                                <Tooltip
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 ring-1 ring-slate-100/50">
                                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-wider">{data.fullName}</p>
                                                    <p className="text-2xl font-black text-guinda-700">{data.value} <span className="text-[10px] text-slate-400 font-bold uppercase">Uds.</span></p>
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
                                    fill="url(#colorToner)"
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
                    </div>
                </DashboardCard>

                {/* Individual Printer Detail */}
                <TonerPrinterStatsWidget />
            </div>

            {/* Right Column (Widgets) - Span 1 */}
            <div className="lg:col-span-1 flex flex-col gap-6">

                {/* Period Selector Card */}
                <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100 shrink-0">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Periodo</h3>
                    <MonthYearFilter
                        month={selectedMonth}
                        year={selectedYear}
                        onMonthChange={setSelectedMonth}
                        onYearChange={setSelectedYear}
                    />
                </div>

                {/* Mini KPIs */}
                <div className="grid grid-cols-2 gap-4 shrink-0">
                    <DashboardCard className="p-4 flex flex-col justify-center min-h-[100px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Puntos de Cambio</p>
                        <p className="text-2xl font-black text-slate-800">{currentMonthCons.toLocaleString()}</p>
                    </DashboardCard>
                    <DashboardCard className="p-4 flex flex-col justify-center min-h-[100px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Eficiencia Mensual</p>
                        {(() => {
                            const prevMonthIdx = selectedMonth === 1 ? 11 : selectedMonth - 2;
                            const prevYearValue = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
                            
                            const prevMonthData = history?.find(d => 
                                d.month === (prevMonthIdx + 1) && d.year === prevYearValue
                            );
                            
                            const prevValue = prevMonthData?.changes || 0;
                            const diff = prevValue > 0 ? ((currentMonthCons - prevValue) / prevValue) * 100 : 0;
                            const isIncrease = diff > 0;
                            const absDiff = Math.abs(Math.round(diff));

                            if (prevValue === 0) return <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Sin histórico</p>;

                            return (
                                <div className="flex flex-col">
                                    <p className={cn(
                                        "text-sm font-black flex items-center gap-1",
                                        isIncrease ? "text-red-500" : "text-emerald-500"
                                    )}>
                                        {isIncrease ? '+' : '-'}{absDiff}%
                                        <TrendingUp className={cn("w-3 h-3", isIncrease ? "" : "rotate-180")} />
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">vs Mes Anterior</p>
                                </div>
                            );
                        })()}
                    </DashboardCard>
                </div>

                {/* Top Consumers Report Widget */}
                <DashboardCard className="flex-1 p-6 flex flex-col min-h-0">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6 shrink-0">
                        Consumo de Tóner
                    </h3>

                    <div className="flex-1 overflow-hidden">
                        {isConsumersLoading ? (
                            <div className="h-[400px] flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-slate-100 border-t-guinda-700 rounded-full animate-spin"></div>
                            </div>
                        ) : (!topConsumers || topConsumers.length === 0) ? (
                            <div className="h-[400px] flex flex-col items-center justify-center opacity-50">
                                <Droplet className="w-12 h-12 text-slate-300 mb-4" />
                                <p className="text-sm font-black text-slate-300 uppercase tracking-widest text-center">Sin consumos este mes</p>
                            </div>
                        ) : (
                            <div className="h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <th className="pb-3 pl-2">Equipo / Ubicación</th>
                                            <th className="pb-3 text-right pr-2">Uds.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topConsumers.map((consumer, idx) => {
                                            const isExpanded = expandedRow === consumer.assetId;
                                            const tonerBrand = consumer.printerName ? consumer.printerName.split(' ')[0] : 'IMPRESORA';

                                            return (
                                                <React.Fragment key={consumer.assetId}>
                                                    <tr
                                                        className={cn(
                                                            "group cursor-pointer transition-all duration-200",
                                                            isExpanded ? "bg-guinda-50/50" : "hover:bg-slate-50"
                                                        )}
                                                        onClick={() => setExpandedRow(isExpanded ? null : consumer.assetId)}
                                                    >
                                                        <td className="py-3 px-2 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100">
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-black text-slate-700 uppercase leading-tight group-hover:text-guinda-700 transition-colors">
                                                                    {idx + 1}. {consumer.printerName || `Asset ${consumer.assetId}`}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                                    {consumer.areaName || 'Sin área'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-2 text-right rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <span className="text-sm font-black text-slate-800 tracking-tighter">{consumer.toner_count}</span>
                                                                {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-300" /> : <ChevronDown className="w-3 h-3 text-slate-300" />}
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Expandable Details within table layout */}
                                                    {isExpanded && consumer.events && (
                                                        <tr>
                                                            <td colSpan={2} className="px-1 py-1">
                                                                <div className="flex flex-col gap-2 p-3 bg-white rounded-2xl border border-guinda-100 shadow-sm animate-in slide-in-from-top-2 duration-300 mb-2 mt-1 mx-1">
                                                                    <h4 className="text-[9px] font-black text-guinda-700 uppercase tracking-widest flex items-center gap-2 mb-1">
                                                                        <Calendar className="w-3 h-3" /> Historial de Reemplazo
                                                                    </h4>
                                                                    <div className="grid gap-1.5">
                                                                        {consumer.events.map((ev, i) => {
                                                                            const eventDate = new Date(ev.date);
                                                                            return (
                                                                                <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-xl">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-6 h-6 rounded-full bg-amber-100/50 flex items-center justify-center">
                                                                                            <PackageOpen className="w-3 h-3 text-amber-700" />
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-[10px] font-black text-slate-700">TÓNER {tonerBrand}</p>
                                                                                            <p className="text-[8px] text-slate-400 font-black tracking-widest uppercase">{ev.type}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <p className="text-[9px] font-black text-slate-600">{eventDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).toUpperCase()}</p>
                                                                                        <p className="text-[8px] font-bold text-slate-400 tracking-wider">
                                                                                            {eventDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
};
