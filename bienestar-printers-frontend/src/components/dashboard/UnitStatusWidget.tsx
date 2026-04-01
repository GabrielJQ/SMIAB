"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useOperationalStatus } from '@/hooks/useOperationalStatus';
import { Activity } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';

export const UnitStatusWidget = () => {
    const { data: stats, isFetching } = useOperationalStatus();

    const currentStats = stats || { total: 0, online: 0, offline: 0 };

    return (
        <DashboardCard className="flex flex-col justify-between min-h-[200px]">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-50/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-3 tracking-tight">
                    <Activity className="w-4 h-4 text-guinda-700" />
                    Estado Operativo
                </h3>
                <span className={`text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-2 shadow-sm ${isFetching ? 'animate-pulse' : ''}`}>
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    EN VIVO
                </span>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 mb-4 relative z-10">
                <div className="bg-white/60 backdrop-blur-sm border border-slate-200/60 p-3 rounded-xl text-center shadow-sm transition-transform hover:scale-105 flex flex-col justify-center items-center group">
                    <div className="text-4xl font-black text-slate-800 leading-none mb-1 group-hover:scale-110 transition-transform duration-300">{currentStats.total}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold tracking-[0.15em]">Total</div>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-xl text-center shadow-sm transition-transform hover:scale-105 flex flex-col justify-center items-center group">
                    <div className="text-4xl font-black text-emerald-600 leading-none mb-1 group-hover:scale-110 transition-transform duration-300">{currentStats.online}</div>
                    <div className="text-[9px] text-emerald-600/70 uppercase font-bold tracking-[0.15em]">Online</div>
                </div>
                <div className="bg-red-50/50 border border-red-100/50 p-3 rounded-xl text-center shadow-sm transition-transform hover:scale-105 flex flex-col justify-center items-center group">
                    <div className="text-4xl font-black text-red-600 leading-none mb-1 group-hover:scale-110 transition-transform duration-300">{currentStats.offline}</div>
                    <div className="text-[9px] text-red-600/70 uppercase font-bold tracking-[0.15em]">Offline</div>
                </div>
            </div>

            <p className="text-[9px] text-slate-400/80 text-center font-bold uppercase tracking-widest relative z-10 opacity-60">
                Monitoreo en tiempo real &bull; Unidad de Bienestar
            </p>
        </DashboardCard>
    );
};
