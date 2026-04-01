'use client';

import React, { useState } from 'react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { MonthYearFilter } from '../dashboard/MonthYearFilter';
import { useUnitTopPrinters } from '@/hooks/useUnitTopPrinters';
import { useUnitHistory } from '@/hooks/useUnitHistory';
import { Activity } from 'lucide-react';

export const TopPrintingVolumeWidget = () => {
    const now = new Date();
    const initialMonth = now.getMonth() + 1;
    const initialYear = now.getFullYear();

    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [selectedMonth, setSelectedMonth] = useState(initialMonth);

    // Initial logic: if current day <= 5, default to previous month to show completed reports

    const { data: topPrinters, isLoading: isTopLoading } = useUnitTopPrinters(selectedYear, selectedMonth);

    // useUnitHistory returns data for the selected month and previous months of the same year
    const { data: historyData, isLoading: isHistoryLoading } = useUnitHistory(selectedYear, selectedMonth);

    // FIX: Buscar específicamente el mes seleccionado en lugar de sumar todo el historial (Evita discrepancia vs gráfico global)
    const selectedMonthData = historyData?.find(d => Number(d.month) === selectedMonth);

    const totalMensual = Number(selectedMonthData?.print_total) || 0;
    const totalImpressions = Number(selectedMonthData?.print_only) || 0;
    const totalCopies = Number(selectedMonthData?.copies) || 0;

    const impPercent = totalMensual > 0 ? Math.round((totalImpressions / totalMensual) * 100) : 0;
    const copyPercent = totalMensual > 0 ? Math.round((totalCopies / totalMensual) * 100) : 0;

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

                <div className="flex-1 min-h-0 flex flex-col">
                    {isTopLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : (!topPrinters || topPrinters.length === 0) ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-50 min-h-[400px]">
                            <Activity className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-widest text-center">Sin datos en el periodo</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-5 min-h-0">
                            {topPrinters.map((printer, idx) => (
                                <div key={printer.printerId} className="flex flex-col gap-2 shrink-0">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-sm font-bold text-slate-700 uppercase">{idx + 1}. {printer.name}</span>
                                        <span className="text-xs font-bold text-slate-500">{printer.totalImpressions.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-guinda-700 rounded-full transition-all duration-1000 ease-out"
                                            style={{ 
                                                width: `${(printer.totalImpressions / (topPrinters[0]?.totalImpressions || 1)) * 100}%` 
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DashboardCard>
        </div>
    );
};
