"use client";

import React from 'react';
import { Menu, X } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { usePathname } from 'next/navigation';

export const MobileNav = () => {
    const { isMobileMenuOpen, toggleMobileMenu } = useDashboardStore();
    const pathname = usePathname();

    const getPageTitle = () => {
        if (pathname.includes('/printers')) return 'Impresoras';
        if (pathname.includes('/statistics')) return 'Estadísticas';
        if (pathname.includes('/toner')) return 'Tóner';
        return 'SMIAB Bienestar';
    };

    return (
        <div className="md:hidden flex items-center justify-between p-4 bg-white/95 backdrop-blur-xl border-b border-slate-200 fixed top-0 left-0 w-full z-50 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleMobileMenu}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 focus:outline-none focus:ring-2 focus:ring-guinda-500/20"
                >
                    {isMobileMenuOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <Menu className="w-6 h-6" />
                    )}
                </button>
                <h1 className="text-lg font-bold text-slate-800">{getPageTitle()}</h1>
            </div>
            <div className="w-8 h-8 rounded-full bg-guinda-700 flex items-center justify-center text-white font-bold text-xs">
                S
            </div>
        </div>
    );
};
