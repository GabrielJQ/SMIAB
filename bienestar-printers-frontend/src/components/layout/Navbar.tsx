"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Printer, Droplet, BarChart3, Menu, X } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';

const NAV_ITEMS = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Impresoras', path: '/printers', icon: Printer },
    { name: 'Tóner', path: '/toner', icon: Droplet },
    { name: 'Impresión', path: '/statistics', icon: BarChart3 },
];

export const Navbar = () => {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const { unitName } = useDashboardStore();
    const displayUnitName = unitName || "Alimentación Bienestar";

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
            {/* Línea de acento superior sutil */}
            <div className="h-[2px] w-full bg-linear-to-r from-guinda-100 via-guinda-600 to-guinda-100" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-9">
                <div className="flex justify-between h-16">
                    {/* Logo Section */}
                    <div className="flex items-center gap-10">
                        <Link href="/dashboard" className="flex-shrink-0 flex items-center gap-3 group transition-transform duration-300 hover:scale-[1.02]">
                            <div className="w-9 h-9 bg-linear-to-br from-guinda-600 to-guinda-800 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-guinda-900/20 ring-1 ring-white/20">
                                S
                            </div>
                            <span className="hidden md:block text-guinda-900 font-black text-xl tracking-tighter uppercase italic">SMIAB</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1.5 h-10 bg-slate-100/30 p-1 rounded-full border border-slate-200/50 backdrop-blur-sm">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={cn(
                                            "relative inline-flex items-center px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
                                            isActive
                                                ? "bg-white text-guinda-700 shadow-[0_2px_10px_-1px_rgba(0,0,0,0.1)] border border-slate-100"
                                                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                                        )}
                                    >
                                        <Icon className={cn("w-3.5 h-3.5 mr-2", isActive ? "text-guinda-600" : "text-slate-400")} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Unit Name & Mobile Menu Button */}
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-3 bg-white/40 px-4 py-2 rounded-2xl border border-white/50 shadow-sm">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 ring-1 ring-slate-200 shadow-inner">
                                <Printer size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">Unidad Activa</span>
                                <span className="text-xs font-bold text-slate-800 leading-tight">{displayUnitName}</span>
                            </div>
                        </div>

                        <div className="-mr-2 flex items-center md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-guinda-600 hover:bg-guinda-50 transition-all duration-200"
                            >
                                <span className="sr-only">Menu</span>
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Refined */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-2xl border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center px-4 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all",
                                        isActive
                                            ? "bg-guinda-600 text-white shadow-lg shadow-guinda-600/20"
                                            : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 mr-4", isActive ? "text-white" : "text-slate-400")} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
};
