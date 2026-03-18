"use client";

import React, { useState } from 'react';
import { useUnitTonerStats } from '@/hooks/useUnitTonerStats';
import { useUnitTopConsumers } from '@/hooks/useUnitTopConsumers';
import { TonerPrinterStatsWidget } from '@/components/toner/TonerPrinterStatsWidget';
import { Droplet, TrendingUp, Trophy, Printer as PrinterIcon, Calendar, ChevronDown, ChevronUp, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { MonthYearFilter } from '@/components/dashboard/MonthYearFilter';
import { BaseBarChart } from '@/components/ui/charts/BaseBarChart';
import { CHART_COLORS, MONTH_NAMES } from '@/lib/constants';

export const TonerManagementReport = () => {
    const now = new Date();

    // Selectors for Global Consumption
    const [globalYear, setGlobalYear] = useState(now.getFullYear());
    const [globalMonth, setGlobalMonth] = useState(now.getMonth() + 1);
    
    // Selectors for Top Consumers
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const { data: history, isLoading: isHistoryLoading } = useUnitTonerStats(globalYear, globalMonth);
    const { data: topConsumers, isLoading: isConsumersLoading } = useUnitTopConsumers(selectedYear, selectedMonth);

    const chartData = React.useMemo(() => {
        if (!history) return [];
        return history.map((item, index) => ({
            name: `${MONTH_NAMES[item.month - 1].substring(0, 3)}`,
            fullName: `${MONTH_NAMES[item.month - 1]} ${item.year}`,
            value: item.changes,
            color: CHART_COLORS[index % CHART_COLORS.length]
        }));
    }, [history]);

    const totalConsumed = React.useMemo(() => {
        return history?.reduce((acc, curr) => acc + curr.changes, 0) || 0;
    }, [history]);
    
    const yearsAvailable = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

    if (isHistoryLoading || isConsumersLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-guinda-700 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Global Consumption Chart - Full Width */}
            <DashboardCard className="min-h-[400px]">
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 relative z-10 gap-4">
                    <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                            <Droplet className="w-4 h-4 text-guinda-700" />
                            Consumo Histórico Global
                        </h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-slate-900 leading-none tracking-tighter">
                                {totalConsumed.toLocaleString()}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    Cartuchos Reemplazados
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-20 w-full md:w-auto">
                        <MonthYearFilter 
                            month={globalMonth}
                            year={globalYear}
                            onMonthChange={setGlobalMonth}
                            onYearChange={setGlobalYear}
                        />
                    </div>
                </div>

                <div className="w-full h-[300px] mt-4 relative z-10">
                    {chartData.length > 0 ? (
                        <BaseBarChart
                            data={chartData}
                            dataKey="value"
                            barSize={60}
                            radius={[4, 4, 0, 0]}
                            tooltipContent={({ active, payload }) => {
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
                        >
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#7B1E34" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#7B1E34" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                        </BaseBarChart>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-50">
                            <Droplet className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Sin datos registrados</p>
                        </div>
                    )}
                </div>
            </DashboardCard>

            {/* Bottom Row - Grid 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Top Consumers Table */}
                <DashboardCard className="relative overflow-hidden h-fit flex flex-col">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-50/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">
                                    Top Consumidores
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Equipos con más reemplazos del mes
                                </p>
                            </div>
                        </div>

                        {/* Month and Year Selectors */}
                        <div className="flex items-center gap-2">
                            <MonthYearFilter 
                                month={selectedMonth}
                                year={selectedYear}
                                onMonthChange={setSelectedMonth}
                                onYearChange={setSelectedYear}
                            />
                        </div>
                    </div>

                    <div className="relative z-10 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="pb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Equipo / Ubicación</th>
                                    <th className="pb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase text-center w-32">Reemplazos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {topConsumers && topConsumers.length > 0 ? (
                                    topConsumers.map((consumer, index) => {
                                        const isExpanded = expandedRow === consumer.assetId;
                                        // Extraer marca (Kyocera, Lexmark) de la primera palabra del nombre
                                        const tonerBrand = consumer.printerName ? consumer.printerName.split(' ')[0] : 'Desconocida';

                                        return (
                                            <React.Fragment key={consumer.assetId}>
                                                <tr 
                                                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                                                    onClick={() => setExpandedRow(isExpanded ? null : consumer.assetId)}
                                                >
                                                    <td className="py-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/60 flex flex-col items-center justify-center shrink-0 text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-200 transition-colors">
                                                                <PrinterIcon className="w-4 h-4 mb-0.5" />
                                                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                                    {index < 3 && <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md text-white shadow-sm", index === 0 ? "bg-amber-400" : index === 1 ? "bg-slate-300" : "bg-amber-700")}>#{index + 1}</span>}
                                                                    {consumer.printerName || `IMPRESORA-${consumer.assetId}`}
                                                                </div>
                                                                <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-0.5 group-hover:text-slate-500 transition-colors">
                                                                    {consumer.areaName || 'Área no asignada'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 align-top pt-5">
                                                        <div className="flex justify-center items-center">
                                                            <div className="bg-guinda-50 text-guinda-700 border border-guinda-100 px-3 py-1 rounded-lg text-sm font-black tracking-tighter shadow-inner shadow-guinda-100/50">
                                                                {consumer.toner_count}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                
                                                {/* Expanded Details Form */}
                                                {isExpanded && consumer.events && consumer.events.length > 0 && (
                                                    <tr className="bg-slate-50/50">
                                                        <td colSpan={2} className="px-4 pb-4 pt-1">
                                                            <div className="pl-12">
                                                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <Calendar className="w-3 h-3" /> Detalles de Reemplazo
                                                                </h4>
                                                                <div className="grid gap-2">
                                                                    {consumer.events.map((ev, i) => {
                                                                        const eventDate = new Date(ev.date);
                                                                        return (
                                                                            <div key={i} className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-lg shadow-sm">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                                                        <PackageOpen className="w-3 h-3 text-slate-400" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-[10px] font-bold text-slate-700">TÓNER {tonerBrand}</p>
                                                                                        <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">{ev.type}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <p className="text-[10px] font-bold text-slate-600">{eventDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).toUpperCase()}</p>
                                                                                    <p className="text-[9px] font-black text-slate-400 tracking-wider">{eventDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
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
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="py-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            No hay consumos registrados en este mes
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </DashboardCard>

                {/* Column 2: Individual Printer History */}
                <div className="flex flex-col h-full">
                    <TonerPrinterStatsWidget />
                </div>
            </div>
        </div>
    );
};
