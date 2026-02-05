"use client";

import React from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Wifi, WifiOff, Calendar, Fingerprint, Droplets, Settings, Layers, Activity } from 'lucide-react';

const getSemanticColor = (value: number | null) => {
    if (value === null) return '#e2e8f0'; // Gris (Sin Datos)
    if (value <= 33) return '#EF4444';    // Rojo (Crítico)
    if (value <= 60) return '#F59E0B';    // Naranja (Advertencia)
    if (value <= 85) return '#6366f1';    // Indigo (Bueno)
    return '#10B981';                     // Esmeralda (Óptimo)
};

const DonutMetric = ({ value, label, isToner = false, icon: Icon }: { value: number | null, label: string, isToner?: boolean, icon: any }) => {
    const data = [
        { name: 'Value', value: value ?? 0 },
        { name: 'Rest', value: 100 - (value ?? 0) },
    ];

    const color = getSemanticColor(value);

    return (
        <div className="flex flex-col items-center">
            <div className="w-20 h-20 relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={28}
                            outerRadius={36}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell fill={color} />
                            <Cell fill="#f1f5f9" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-700">
                    <span className="relative">{value ?? '?'}%</span>
                </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black mt-3 text-center leading-tight">{label}</span>
        </div>
    );
};

export const PrinterDetailWidget = () => {
    const { selectedPrinter } = useDashboardStore();

    if (!selectedPrinter) {
        return (
            <div className="h-full bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 opacity-60">
                <Fingerprint className="w-12 h-12 opacity-10 mb-4" />
                <p className="text-sm font-black uppercase tracking-[0.2em] text-center leading-tight">Estado Técnico</p>
            </div>
        );
    }

    const isOnline = selectedPrinter.isOnline;
    const toner = selectedPrinter.tonerLevel;
    const kit = selectedPrinter.kitMaintenance;
    const imgUnit = selectedPrinter.unitImage;

    const updateDate = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    return (
        <div className="h-full bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 leading-tight">{selectedPrinter.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asset ID: {selectedPrinter.id}</p>
                    </div>
                </div>
                <Activity className="w-4 h-4 text-slate-200" />
            </div>

            <div className="flex-1 flex items-center justify-around bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 py-4 px-2">
                <DonutMetric
                    value={toner}
                    label="Nivel Tóner"
                    isToner={true}
                    icon={Droplets}
                />
                <DonutMetric
                    value={kit}
                    label="Mantenimiento"
                    icon={Settings}
                />
                <DonutMetric
                    value={imgUnit}
                    label="Unidad Imagen"
                    icon={Layers}
                />
            </div>

            <div className="mt-6 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Sincronización: <span className="text-slate-600 font-black">{updateDate}</span></span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    v1.0
                </div>
            </div>
        </div>
    );
};
