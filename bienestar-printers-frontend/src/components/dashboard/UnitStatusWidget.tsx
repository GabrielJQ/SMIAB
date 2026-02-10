"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterSummary } from '@/types/printer';
import { Activity, Radio, AlertCircle } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';

const fetchPrintersForStatus = async (): Promise<PrinterSummary[]> => {
    const { data } = await api.get('/printers/unit');
    return data;
};

export const UnitStatusWidget = () => {
    const { data: printers } = useQuery({
        queryKey: ['printers-unit'],
        queryFn: fetchPrintersForStatus,
    });

    const stats = React.useMemo(() => {
        if (!printers) return { total: 0, online: 0, offline: 0 };
        return {
            total: printers.length,
            online: printers.filter(p => p.isOnline).length,
            offline: printers.filter(p => !p.isOnline).length
        };
    }, [printers]);

    return (
        <DashboardCard className="flex flex-col justify-between min-h-[300px]">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-50/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-guinda-700" />
                    Estado Operativo
                </h3>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    EN VIVO
                </span>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-4 mt-6 mb-6 relative z-10 min-h-[140px]">
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 p-4 rounded-2xl text-center shadow-sm transition-transform hover:scale-105 flex flex-col justify-center items-center h-full group">
                    <div className="text-5xl font-black text-slate-800 leading-none mb-2 group-hover:scale-110 transition-transform duration-300">{stats.total}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Total</div>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-2xl text-center shadow-sm transition-transform hover:scale-105 flex flex-col justify-center items-center h-full group">
                    <div className="text-5xl font-black text-emerald-600 leading-none mb-2 group-hover:scale-110 transition-transform duration-300">{stats.online}</div>
                    <div className="text-[10px] text-emerald-600/70 uppercase font-black tracking-[0.2em] flex items-center justify-center gap-1">
                        Online
                    </div>
                </div>
                <div className="bg-red-50/50 border border-red-100/50 p-4 rounded-2xl text-center shadow-sm transition-transform hover:scale-105 flex flex-col justify-center items-center h-full group">
                    <div className="text-5xl font-black text-red-600 leading-none mb-2 group-hover:scale-110 transition-transform duration-300">{stats.offline}</div>
                    <div className="text-[10px] text-red-600/70 uppercase font-black tracking-[0.2em] flex items-center justify-center gap-1">
                        Offline
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-slate-400/80 text-center font-bold uppercase tracking-widest relative z-10 mt-auto">
                Monitoreo en tiempo real &bull; Unidad de Bienestar
            </p>
        </DashboardCard>
    );
};
