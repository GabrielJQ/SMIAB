"use client";

import React from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterStats } from '@/types/printer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, AlertCircle } from 'lucide-react';

const fetchPrinterStatsDetail = async (id: string): Promise<PrinterStats> => {
    const { data } = await api.get(`/printers/stats/${id}`);
    return data;
};

export const PrinterStatsWidget = () => {
    const { selectedPrinterId, selectedPrinter } = useDashboardStore();

    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['printer-stats', selectedPrinterId],
        queryFn: () => fetchPrinterStatsDetail(selectedPrinterId!),
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
                <p className="text-xs font-black text-slate-400 tracking-[0.3em]">SINCRONIZANDO MÉTRICAS...</p>
            </div>
        </div>
    );

    const chartData = [
        { name: 'IMPRESIONES', value: stats?.printerStats ?? 0, color: '#7B1E34' },
        { name: 'COPIAS', value: stats?.scanStats ?? 0, color: '#44403c' },
    ];

    const total = (stats?.printerStats ?? 0) + (stats?.scanStats ?? 0);

    return (
        <div className="h-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        Monitor de Producción
                        <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-600 font-bold border border-emerald-100 uppercase tracking-tighter">Live</div>
                    </h3>
                    <p className="text-sm font-bold text-slate-400 mt-2">
                        <span className="uppercase tracking-widest shrink-0">Impresora:</span>
                        <span className="text-slate-600 ml-2">{selectedPrinter?.name}</span>
                    </p>
                </div>

                <div className="text-right p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                    <div className="text-4xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">{(total).toLocaleString()}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Producción Total</div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[180px] min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ left: 20, right: 60, top: 0, bottom: 20 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={110}
                            tick={{ fontSize: 12, fontWeight: 900, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <CartesianGrid horizontal={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                        <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            labelStyle={{ textTransform: 'uppercase', fontWeight: 900, fontSize: '11px', marginBottom: '4px' }}
                        />
                        <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={54} animationDuration={1000}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rojo (Impresiones)</div>
                        <div className="text-3xl font-black text-guinda-700 leading-none">{stats?.printerStats?.toLocaleString() ?? 0}</div>
                    </div>
                </div>
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gris (Copias)</div>
                        <div className="text-3xl font-black text-slate-600 leading-none">{stats?.scanStats?.toLocaleString() ?? 0}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
