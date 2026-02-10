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
    // Placeholder for dynamic unit name
    // TODO: Implement unit name fetching from a `/me` or `/unit` endpoint once available.
    // Currently, the `PrinterSummary` type only contains `area`, which is not the same as `unit`.
    // The backend `AUTH_TOKEN` is hardcoded in `api.ts` for Phase 0.
    const unitName = "Alimentación Bienestar";

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo Section */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 bg-guinda-700 rounded-lg flex items-center justify-center text-white font-bold">
                                S
                            </div>
                            <span className="hidden md:block text-guinda-900 font-bold text-lg tracking-tight">SMIAB</span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:ml-10 md:flex md:space-x-1">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={cn(
                                            "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                                            isActive
                                                ? "bg-guinda-50 text-guinda-700"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Unit Name & Mobile Menu Button */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">Unidad</span>
                            <span className="text-sm font-bold text-slate-700">{unitName}</span>
                        </div>

                        <div className="-mr-2 flex items-center md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-guinda-500"
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMobileMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-slate-100">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center px-3 py-3 rounded-md text-base font-medium",
                                        isActive
                                            ? "bg-guinda-50 text-guinda-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
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
