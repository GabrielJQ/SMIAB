"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { MonthYearFilter } from '@/components/dashboard/MonthYearFilter';
import { useUnitTopPrinters } from '@/hooks/useUnitTopPrinters';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { PrinterComparison } from '@/types/printer';
import { Activity } from 'lucide-react';

export const TopPrintingVolumeWidget = () => {
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

    const { data: topPrinters, isLoading: isTopLoading } = useUnitTopPrinters(selectedYear, selectedMonth);

    const { data: history, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['unit-history', selectedYear, selectedMonth],
        queryFn: async () => {
            const { data } = await api.get('/printers/unit/history', { params: { year: selectedYear, month: selectedMonth } });
            return data as PrinterComparison[];
        },
    });

    const currentMonthData = history?.find(d => d.month === selectedMonth && d.year === selectedYear);
    const totalImpressions = currentMonthData?.print_only || 0;
    const totalCopies = currentMonthData?.copies || 0;
    const totalMensual = currentMonthData?.print_total || 0;

    // To ensure percentages add up to 100% without exceeding it,
    // we use the sum of parts as the base for the breakdown.
    const totalParts = totalImpressions + totalCopies;
    const impPercent = totalParts > 0 ? Math.round((totalImpressions / totalParts) * 100) : 0;
    const copyPercent = totalParts > 0 ? (totalParts > 0 ? 100 - impPercent : 0) : 0;

    const maxVolume = topPrinters && topPrinters.length > 0 ? topPrinters[0].totalImpressions : 0;

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100 shrink-0">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Periodo</h3>
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Mensual</p>
                    {isHistoryLoading ? (
                        <div className="h-6 bg-slate-100 rounded animate-pulse w-1/2 mt-1"></div>
                    ) : (
                        <p className="text-xl font-bold text-slate-800">{totalMensual.toLocaleString()}</p>
                    )}
                </DashboardCard>
                <DashboardCard className="p-4 flex flex-col justify-center min-h-[100px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Desglose</p>
                    {isHistoryLoading ? (
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4 mt-1 mb-1"></div>
                    ) : (
                        <>
                            <p className="text-xs font-bold text-guinda-700">Imp: {impPercent}% ({totalImpressions.toLocaleString()})</p>
                            <p className="text-xs font-bold text-slate-500">Cop: {copyPercent}% ({totalCopies.toLocaleString()})</p>
                        </>
                    )}
                </DashboardCard>
            </div>

            {/* Report list */}
            <DashboardCard className="p-6 flex flex-col flex-1 h-full min-h-0">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6 shrink-0">
                    <Activity className="w-4 h-4 text-guinda-700" />
                    Reporte de Volumen de Impresión
                </h3>

                <div className="overflow-hidden flex-1 flex flex-col">
                    {isTopLoading ? (
                        <div className="flex-1 flex items-center justify-center min-h-[400px]">
                            <div className="w-8 h-8 border-4 border-slate-100 border-t-guinda-700 rounded-full animate-spin"></div>
                        </div>
                    ) : (!topPrinters || topPrinters.length === 0) ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-50 min-h-[400px]">
                            <Activity className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-widest text-center">Sin datos en el periodo</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-5 min-h-0">
                            {topPrinters.map((printer, idx) => {
                                const percentage = maxVolume > 0 ? (printer.totalImpressions / maxVolume) * 100 : 0;
                                return (
                                    <div key={printer.printerId} className="flex flex-col gap-2 shrink-0">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-sm font-bold text-slate-700 uppercase">{idx + 1}. {printer.name}</span>
                                            <span className="text-xs font-bold text-slate-500">{printer.totalImpressions.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-guinda-700 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DashboardCard>
        </div>
    );
};
