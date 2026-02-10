"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PrinterSummary } from '@/types/printer';
import { useDashboardStore } from '@/store/useDashboardStore';
import { cn } from '@/lib/utils';
import { Search, Activity, LayoutDashboard, X } from 'lucide-react';

const fetchPrinters = async (): Promise<PrinterSummary[]> => {
    const { data } = await api.get('/printers/unit');
    return data;
};

export const Sidebar: React.FC = () => {
    const { selectedPrinterId, setSelectedPrinter, isMobileMenuOpen, setMobileMenuOpen } = useDashboardStore();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: printers, isLoading: loadingPrinters } = useQuery({
        queryKey: ['printers-unit'],
        queryFn: fetchPrinters,
    });

    const filteredPrinters = React.useMemo(() => {
        if (!printers) return [];
        return printers
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                if (a.isOnline === b.isOnline) {
                    return a.name.localeCompare(b.name);
                }
                return a.isOnline ? -1 : 1;
            });
    }, [printers, searchQuery]);

    const statsSummary = React.useMemo(() => {
        if (!printers) return { total: 0, online: 0, offline: 0 };
        return {
            total: printers.length,
            online: printers.filter(p => p.isOnline).length,
            offline: printers.filter(p => !p.isOnline).length
        };
    }, [printers]);

    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = React.useRef<any>(null);

    const handleScroll = () => {
        if (!isScrolling) setIsScrolling(true);

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 1000);
    };

    // Close sidebar when clicking a printer on mobile
    const handlePrinterClick = (printer: PrinterSummary) => {
        setSelectedPrinter(printer);
        setMobileMenuOpen(false);
    };

    if (loadingPrinters) return (
        <div className="w-full md:w-80 h-full bg-white/80 backdrop-blur-2xl border-2 border-guinda-700/15 rounded-[2.5rem] p-4 flex items-center justify-center font-medium text-slate-400 italic shadow-xl shadow-slate-200/50 hidden md:flex">
            Cargando...
        </div>
    );

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-2xl border-r border-guinda-700/15 shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:inset-auto md:h-full md:bg-white/80 md:border-2 md:rounded-[2.5rem] md:shadow-xl md:shadow-slate-200/50 md:z-10 md:shrink-0 overflow-hidden flex flex-col",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-guinda-50/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">

                    <div className="p-4 border-b border-guinda-700/10 bg-transparent">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-guinda-700 flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5" />
                                ALIMENTACIÓN BIENESTAR
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest hidden md:block">SMIAB Bienestar</div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="md:hidden p-1 text-slate-400 hover:text-guinda-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-guinda-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar equipo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500 transition-all font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all"
                                    title="Limpiar búsqueda"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile Module Navigation */}
                    <div className="md:hidden p-4 border-b border-guinda-700/10 space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Módulos</div>
                        <a href="/dashboard" className="flex items-center gap-3 p-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-guinda-700 transition-colors">
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="text-sm font-bold">Dashboard</span>
                        </a>
                        <a href="/printers" className="flex items-center gap-3 p-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-guinda-700 transition-colors">
                            <Activity className="w-4 h-4" />
                            <span className="text-sm font-bold">Impresoras</span>
                        </a>
                        <a href="/toner" className="flex items-center gap-3 p-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-guinda-700 transition-colors">
                            <div className="w-4 h-4 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-current opacity-70" /></div>
                            <span className="text-sm font-bold">Tóner</span>
                        </a>
                        <a href="/statistics" className="flex items-center gap-3 p-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-guinda-700 transition-colors">
                            <div className="w-4 h-4 flex items-center justify-center"><div className="w-0.5 h-3 bg-current opacity-70 rounded-full" /></div>
                            <span className="text-sm font-bold">Impresión</span>
                        </a>
                    </div>

                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 bg-transparent mt-2">EQUIPOS DE IMPRESIÓN</div>

                    <div
                        className={cn(
                            "h-[25vh] md:h-auto md:flex-1 overflow-y-auto p-2 space-y-1 bg-transparent relative custom-scrollbar",
                            isScrolling && "is-scrolling"
                        )}
                        onScroll={handleScroll}
                    >

                        {filteredPrinters.length > 0 ? (
                            filteredPrinters.map((printer) => (
                                <button
                                    key={printer.id}
                                    onClick={() => handlePrinterClick(printer)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-300 group outline-none border border-transparent relative overflow-hidden",
                                        selectedPrinterId === printer.id
                                            ? "bg-guinda-500/[0.08] border-guinda-500/20 shadow-[inner_0_2px_4px_rgba(123,30,52,0.1)] backdrop-blur-sm scale-[0.98]"
                                            : "hover:bg-slate-50 hover:border-slate-100 active:scale-[0.99]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        printer.isOnline ? "bg-emerald-500 shadow-sm shadow-emerald-200" : "bg-red-500 shadow-sm shadow-red-200"
                                    )} />

                                    <div className="flex-1 min-w-0">
                                        <div className={cn(
                                            "text-sm font-semibold truncate",
                                            selectedPrinterId === printer.id ? "text-guinda-900" : "text-slate-600"
                                        )}>
                                            {printer.name}
                                        </div>
                                        <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate">
                                            {printer.area || 'Sin área'}
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : searchQuery ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                    <Search className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-tight">No se encontraron<br />coincidencias</p>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-4 text-[10px] font-bold text-guinda-600 hover:text-guinda-700 underline underline-offset-4"
                                >
                                    Limpiar búsqueda
                                </button>
                            </div>
                        ) : null}
                    </div>

                    {/* Footer: Estadísticas Consolidadas (Physical Inventory Only) */}
                    <div className="p-4 bg-slate-50/50 border-t border-guinda-700/10">
                        <div className="flex items-center gap-2 mb-3">
                            <Activity className="w-3.5 h-3.5 text-guinda-700" />
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unidad Oaxaca</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/60 border border-slate-100 p-2 rounded-lg text-center shadow-sm">
                                <div className="text-base font-black text-slate-700">{statsSummary.total}</div>
                                <div className="text-[7px] text-slate-400 uppercase font-black">Equipos</div>
                            </div>
                            <div className="bg-white/60 border border-slate-100 p-2 rounded-lg text-center shadow-sm">
                                <div className="text-base font-black text-emerald-600">{statsSummary.online}</div>
                                <div className="text-[7px] text-emerald-600/70 uppercase font-black">Online</div>
                            </div>
                            <div className="bg-white/60 border border-slate-100 p-2 rounded-lg text-center shadow-sm">
                                <div className="text-base font-black text-red-600">{statsSummary.offline}</div>
                                <div className="text-[7px] text-red-600/70 uppercase font-black">Offline</div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};
