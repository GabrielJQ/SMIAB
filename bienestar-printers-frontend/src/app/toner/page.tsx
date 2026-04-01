"use client";

import React, { useState } from "react";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TonerManagementReport } from "@/components/toner/TonerManagementReport";
import { TonerOperationalAlerts } from "@/components/toner/TonerOperationalAlerts";
import { BarChart3, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TonerPage() {
    const [activeTab, setActiveTab] = useState<'gerencial' | 'operativo'>('gerencial');

    return (
        <div className="flex flex-col h-screen md:h-[calc(100vh-7rem)] pt-20 md:pt-0">
            <MobileNav />
            <div className="flex flex-1 overflow-hidden gap-6 relative">
                <Sidebar />

                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1 w-full">
                    {/* Tabs Header */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100/50 backdrop-blur-sm rounded-2xl w-fit border border-slate-200/60 shadow-sm relative z-20">
                        <button
                            onClick={() => setActiveTab('gerencial')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                                activeTab === 'gerencial'
                                    ? "bg-white text-guinda-700 shadow-md shadow-slate-200/50 ring-1 ring-slate-200/50"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Reporte de Consumo
                        </button>
                        <button
                            onClick={() => setActiveTab('operativo')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                                activeTab === 'operativo'
                                    ? "bg-white text-guinda-700 shadow-md shadow-slate-200/50 ring-1 ring-slate-200/50"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <ShieldAlert className="w-4 h-4" />
                            Alertas y Suministros
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'gerencial' ? (
                            <TonerManagementReport />
                        ) : (
                            <TonerOperationalAlerts />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
