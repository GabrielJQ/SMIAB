"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterSummary } from '@/types/printer';
import { Activity, Radio, AlertCircle } from 'lucide-react';

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
        <div className="h-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-guinda-700" />
                    Estado de la Unidad
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">VISTA REAL</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                    <div className="text-3xl font-black text-slate-800 leading-none">{stats.total}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-black mt-2 tracking-widest">Total</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                    <div className="text-3xl font-black text-emerald-600 leading-none">{stats.online}</div>
                    <div className="text-[10px] text-emerald-600/70 uppercase font-black mt-2 tracking-widest flex items-center justify-center gap-1">
                        <Radio className="w-2.5 h-2.5" /> Online
                    </div>
                </div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                    <div className="text-3xl font-black text-red-600 leading-none">{stats.offline}</div>
                    <div className="text-[10px] text-red-600/70 uppercase font-black mt-2 tracking-widest flex items-center justify-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> Offline
                    </div>
                </div>
            </div>

            <p className="mt-4 text-[11px] text-slate-400 text-center font-medium">
                Monitoreo consolidado de la Unidad de Bienestar
            </p>
        </div>
    );
};
