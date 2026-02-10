"use client";

import { UnitStatusWidget } from "@/components/dashboard/UnitStatusWidget";
import { GeneralStatsWidget } from "@/components/dashboard/GeneralStatsWidget";
import { TonerUnitStatsWidget } from "@/components/toner/TonerUnitStatsWidget";

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Executive Summary - Unit Status */}
                <div className="flex-1 min-h-[300px]">
                    <UnitStatusWidget />
                </div>

                {/* Global Stats - General History */}
                <div className="flex-[1.5] min-h-[300px]">
                    <GeneralStatsWidget />
                </div>
            </div>

            {/* Toner Summary Section */}
            <div className="h-[350px]">
                <TonerUnitStatsWidget />
            </div>

            {/* Future Executive Widgets could go here */}
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center text-slate-400">
                <p className="text-xs font-bold uppercase tracking-widest">Más métricas ejecutivas en desarrollo...</p>
            </div>
        </div>
    );
}
