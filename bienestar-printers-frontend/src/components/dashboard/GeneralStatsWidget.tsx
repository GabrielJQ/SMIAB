"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterComparison } from '@/types/printer';
import { Globe, FileUp, ChevronDown, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { BaseBarChart } from '@/components/ui/charts/BaseBarChart';
import { CHART_COLORS, MONTH_NAMES } from '@/lib/constants';
import { ImportHistoryModal } from './ImportHistoryModal';
import { useModalStore } from '@/store/useModalStore';
import { useExportModalStore } from '@/store/useExportModalStore';
import { toast } from 'react-hot-toast';
import { ConfirmActionModal } from '@/components/ui/ConfirmActionModal';
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

const fetchUnitHistory = async (year: number): Promise<{currentYear: PrinterComparison[], previousYear: PrinterComparison[]}> => {
    // We always request month 12 to get the full year history from the backend
    const [currentRes, previousRes] = await Promise.all([
        api.get('/printers/unit/history', { params: { year, month: 12 } }),
        api.get('/printers/unit/history', { params: { year: year - 1, month: 12 } })
    ]);
    return {
        currentYear: currentRes.data,
        previousYear: previousRes.data
    };
};

interface ChartData {
    name: string;
    value: number;
    previousValue: number;
    color: string;
    fullName?: string;
    trendValue?: number;
}

export const GeneralStatsWidget = () => {
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const { openImportModal } = useModalStore();
    const { openExportModal } = useExportModalStore();
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isExecutingClosure, setIsExecutingClosure] = useState(false);

    const { data: historyData, isLoading, refetch } = useQuery({
        queryKey: ['unit-history', selectedYear],
        queryFn: () => fetchUnitHistory(selectedYear),
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

    let chartData: ChartData[] = [];
    let totalProduction = 0;

    if (historyData) {
        // VIEW: HISTORICAL UNIT STATS (12 MONTHS COMPOSED CHART)
        const yearData = historyData.currentYear.filter(d => d.year === selectedYear);
        const prevYearData = historyData.previousYear.filter(d => d.year === (selectedYear - 1));

        // Generate strict 12-month array
        chartData = Array.from({ length: 12 }, (_, index) => {
            const iterMonth = index + 1;
            const dbRecord = yearData.find(d => d.month === iterMonth);
            const prevDbRecord = prevYearData.find(d => d.month === iterMonth);
            
            const value = dbRecord ? (dbRecord.print_total ?? 0) : 0;
            const previousValue = prevDbRecord ? (prevDbRecord.print_total ?? 0) : 0;

            return {
                name: `${MONTH_NAMES[index]}`,
                fullName: `${MONTH_NAMES[index]} ${selectedYear}`,
                value: value,
                previousValue: previousValue,
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
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed text-center text-slate-400">Consolidando<br />Datos Globales...</p>
        </DashboardCard>
    );

    const handleManualClose = async () => {
        setIsExecutingClosure(true);
        const toastId = toast.loading('Ejecutando cierre mensual...');
        try {
            await api.post('/printers/sync/monthly-closing');
            toast.success('Cierre mensual ejecutado exitosamente', { id: toastId });
            refetch();
            setIsConfirmModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Error al ejecutar el cierre mensual', { id: toastId });
        } finally {
            setIsExecutingClosure(false);
        }
    };

    const isEndOfMonth = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        // Activar a partir de los últimos 4 días del mes (ej: del 28 al 31 en marzo)
        return today.getDate() > (lastDay - 4);
    };

    const isMonthClosed = () => {
        if (!historyData) return false;
        const currentMonth = new Date().getMonth() + 1;
        const currentYearValue = new Date().getFullYear();
        
        const currentMonthData = historyData.currentYear.find(d => d.month === currentMonth && d.year === currentYearValue);
        // Si el mes actual ya tiene datos de producción, significa que el cierre ya se ejecutó con éxito.
        return currentMonthData !== undefined && (currentMonthData.print_total ?? 0) > 0;
    };

    // MODO NORMAL:
    // El UI solo debe activarse si estamos en la pestaña del año actual. No para años pasados.
    const showClosureUI = selectedYear === currentYear && isEndOfMonth() && !isMonthClosed();

    return (
        <div className="flex flex-col w-full h-full gap-4">
            {showClosureUI && (
                <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl flex items-center gap-3 relative z-10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 flex-none">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
                    <div>
                        <p className="text-sm font-bold">¡Cierre Mensual Pendiente!</p>
                        <p className="text-xs opacity-90">El mes está por concluir. Recuerda ejecutar el cierre estadístico en el panel debajo para guardar el avance en el historial.</p>
                    </div>
                </div>
            )}
            <DashboardCard className="min-h-[400px] flex-1 flex flex-col justify-between h-full">
                {/* Decoration */}
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-slate-100/50 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 relative z-10 gap-6">
                    <div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                            <Globe className="w-3.5 h-3.5 text-guinda-700" />
                            Resumen de Producción
                        </h3>
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-slate-900 leading-none tracking-tighter">
                                {totalProduction.toLocaleString()}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Documentos Totales
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                    Consolidado {selectedYear}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
                        {/* Grupo: Gestión del Periodo */}
                        <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100 gap-2">
                            {/* Year Selector */}
                            <div className="relative group">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="appearance-none cursor-pointer bg-white border border-slate-200 py-2 px-4 pr-9 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-widest shadow-sm transition-all hover:border-guinda-200 focus:outline-none focus:ring-2 focus:ring-guinda-500/10 outline-none"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                            </div>

                            <button 
                                onClick={() => setIsConfirmModalOpen(true)}
                                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:shadow-md active:scale-95 shadow-sm"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Cierre Mensual
                            </button>
                        </div>

                        {/* Grupo: Acciones de Datos */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => openExportModal()}
                                title="Exportar Reporte"
                                className="p-2.5 bg-white hover:bg-guinda-50 text-slate-400 hover:text-guinda-700 border border-slate-200 rounded-xl transition-all hover:border-guinda-200 group"
                            >
                                <Download className="w-4 h-4" />
                            </button>

                            <button 
                                onClick={() => openImportModal(() => refetch())}
                                title="Importar Historial"
                                className="p-2.5 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl transition-all hover:border-slate-300 group"
                            >
                                <FileUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full h-[350px] mt-4 relative z-10 flex-1">
                    {(!historyData) ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-50">
                            <Globe className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Sin datos disponibles</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={chartData}
                                margin={{ top: 20, right: 10, left: -20, bottom: 15 }}
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
                                                <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 ring-1 ring-slate-100/50 min-w-[140px]">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">{data.name}</p>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex justify-between items-baseline gap-4">
                                                            <span className="text-xl font-bold text-guinda-700">{data.value.toLocaleString()}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedYear}</span>
                                                        </div>
                                                        <div className="flex justify-between items-baseline gap-4 border-t border-slate-100 pt-2">
                                                            <span className="text-sm font-bold text-slate-500">{data.previousValue.toLocaleString()}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedYear - 1}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="previousValue"
                                    stroke="#cbd5e1"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    fillOpacity={0.3}
                                    fill="#e2e8f0"
                                    activeDot={false}
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
                                    strokeWidth={2.5}
                                    dot={{ fill: '#fff', stroke: '#7B1E34', strokeWidth: 1.5, r: 3 }}
                                    activeDot={{ r: 5, fill: '#7B1E34', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </DashboardCard>

            <ConfirmActionModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleManualClose}
                isExecuting={isExecutingClosure}
                title="Cierre Estadístico Mensual"
                description={
                    <>
                        ¿Estás seguro de ejecutar el cierre de mes?
                        <br /><br />
                        Esto registrará permanentemente el contador absoluto de <b>todas las impresoras</b> activas en este momento bajo el bloque actual. Esta acción es irreversible.
                    </>
                }
                confirmText="Ejecutar Cierre Definitivo"
            />
        </div>
    );
};
