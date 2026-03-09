"use client";

import React from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Wifi, WifiOff, Calendar, Fingerprint, Droplets, Settings, Layers, Activity, Printer as PrinterIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/components/ui/DashboardCard';

const getSemanticColor = (value: number | null) => {
    if (value === null) return '#e2e8f0'; // Gris (Sin Datos)
    if (value <= 33) return '#EF4444';    // Rojo (Crítico)
    if (value <= 60) return '#F59E0B';    // Naranja (Advertencia)
    if (value <= 85) return '#6366f1';    // Indigo (Bueno)
    return '#10B981';                     // Esmeralda (Óptimo)
};

const DonutMetric = ({ value, label, icon: Icon }: { value: number | null, label: string, icon: any }) => {
    const data = [
        { name: 'Value', value: value ?? 0 },
        { name: 'Rest', value: 100 - (value ?? 0) },
    ];

    const color = getSemanticColor(value);

    return (
        <div className="flex flex-col items-center group w-full">
            <div className="relative w-32 h-32 md:w-40 md:h-40 xl:w-56 xl:h-56 transition-transform duration-500 ease-out group-hover:scale-105">
                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-opacity duration-700 group-hover:opacity-40" style={{ backgroundColor: color }}></div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius="60%"
                            outerRadius="80%"
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={40}
                            paddingAngle={5}
                        >
                            <Cell fill={color} />
                            <Cell fill="#f1f5f9" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Icon className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2 text-slate-300" />
                    <span className="text-2xl md:text-4xl xl:text-5xl font-black text-slate-800 tracking-tighter transition-colors duration-300 group-hover:text-slate-900">
                        {value ?? '?'}
                        <span className="text-xs md:text-lg xl:text-xl text-slate-400 font-bold ml-0.5">%</span>
                    </span>
                </div>
            </div>
            <span className="text-[10px] md:text-sm uppercase tracking-[0.1em] md:tracking-[0.2em] text-slate-400 font-black mt-3 md:mt-6 text-center leading-tight">{label}</span>
        </div>
    );
};

const fetchTonerHistory = async (id: string) => {
    const { data } = await api.get(`/printers/${id}/toner-history`);
    return data;
};

export const PrinterDetailWidget = () => {
    const { selectedPrinter } = useDashboardStore();

    const { data: tonerHistory, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['toner-history', selectedPrinter?.id],
        queryFn: () => fetchTonerHistory(selectedPrinter!.id),
        enabled: !!selectedPrinter?.id,
    });

    if (!selectedPrinter) {
        return (
            <DashboardCard className="flex flex-col items-center justify-center text-slate-300 p-12 transition-all duration-500">
                <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <PrinterIcon className="w-16 h-16 opacity-20" />
                </div>
                <p className="text-lg font-black uppercase tracking-[0.3em] text-center opacity-60">Selecciona un equipo</p>
                <p className="text-sm font-medium text-slate-400 mt-2">Visualiza el estado de consumibles</p>
            </DashboardCard>
        );
    }

    const { isOnline, tonerLevel, kitMaintenance, unitImage: imgUnit, name, id } = selectedPrinter;

    const updateDate = new Date().toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <DashboardCard className="p-8 md:p-12">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-guinda-50/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-12 gap-4 md:gap-6">
                <div>
                    <div className="flex items-center gap-2 md:gap-4 mb-2">
                        <div className={cn(
                            "px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider flex items-center gap-2 border shadow-sm transition-all duration-500",
                            isOnline
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50"
                                : "bg-red-50 text-red-600 border-red-100 shadow-red-100/50"
                        )}>
                            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            {isOnline ? "En Línea" : "Desconectada"}
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-slate-100">
                            ID: {id}
                        </span>
                    </div>
                    <h2 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                        {name}
                    </h2>
                </div>

                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Última Sincronización</p>
                    <p className="text-sm font-black text-slate-600 capitalize flex items-center justify-end gap-2">
                        <Calendar className="w-4 h-4 text-guinda-700" />
                        {updateDate}
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className={cn(
                "flex-1 relative z-10 grid grid-cols-2 md:flex md:flex-row items-center justify-evenly gap-6 md:gap-12 py-4 md:py-8 transition-all duration-500",
                !isOnline && "grayscale opacity-80"
            )}>
                <DonutMetric
                    value={tonerLevel}
                    label="Nivel de Tóner"
                    icon={Droplets}
                />

                {/* Divider for desktop */}
                <div className="hidden md:block w-px h-32 bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>

                <DonutMetric
                    value={kitMaintenance}
                    label="Kit de Mantenimiento"
                    icon={Settings}
                />

                <div className="hidden md:block w-px h-32 bg-gradient-to-b from-transparent via-slate-200 to-transparent"></div>

                <DonutMetric
                    value={imgUnit}
                    label="Unidad de Imagen"
                    icon={Layers}
                />
            </div>

            {/* History Chart & Action Button */}
            <div className="mt-4 relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                {/* Chart Area */}
                <div className="flex-1 w-full bg-slate-50/50 rounded-2xl p-4 md:p-6 border border-slate-100">
                    <h3 className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                        Historial de Tóner (30 días)
                    </h3>
                    <div className="h-48 w-full">
                        {isLoadingHistory ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <Activity className="w-6 h-6 text-slate-300 animate-spin" />
                            </div>
                        ) : tonerHistory && tonerHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={tonerHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorToner" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={30} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#475569' }}
                                    />
                                    <Area type="monotone" dataKey="tonerLevel" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorToner)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                                Sin datos históricos suficientes
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Area */}
                <div className="w-full md:w-64 flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100 h-full min-h-[240px]">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">
                        Gestión de Consumibles
                    </h3>
                    <p className="text-xs text-slate-500 text-center mb-6 min-h-[40px]">
                        {tonerLevel === null
                            ? "Lectura no disponible"
                            : tonerLevel <= 33
                                ? "Nivel crítico. Es necesario un reemplazo de inmediato."
                                : tonerLevel <= 60
                                    ? "Nivel bajo. Puedes solicitar un repuesto preventivo."
                                    : "El nivel de tóner es adecuado. No requiere acción."}
                    </p>
                    <button
                        disabled={tonerLevel === null || tonerLevel > 60 || !isOnline}
                        onClick={() => alert('Nueva Alerta de Consumible registrada (simulado)')}
                        className={cn(
                            "w-full py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2",
                            tonerLevel !== null && tonerLevel <= 60 && isOnline
                                ? "bg-guinda-600 text-white hover:bg-guinda-700 shadow-md hover:shadow-lg shadow-guinda-600/20"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {tonerLevel !== null && tonerLevel <= 33 && isOnline && <AlertTriangle className="w-4 h-4" />}
                        Solicitar Consumible
                    </button>
                    {!isOnline && (
                        <span className="text-[10px] text-red-500 font-bold mt-4 text-center">
                            Equipo fuera de línea
                        </span>
                    )}
                </div>
            </div>

            {/* Footer / Status Bar */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-slate-400 relative z-10">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                    <Activity className="w-4 h-4 text-slate-300" />
                    Estado del Dispositivo
                </div>
                <div className="h-1.5 flex gap-1">
                    <div className="w-2 h-full rounded-full bg-green-400 animate-pulse"></div>
                    <div className="w-1 h-full rounded-full bg-green-400/50"></div>
                    <div className="w-1 h-full rounded-full bg-green-400/20"></div>
                </div>
            </div>
        </DashboardCard>
    );
};
