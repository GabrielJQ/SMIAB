"use client";

import React from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { TonerUnitStatsWidget } from "@/components/toner/TonerUnitStatsWidget";
import { TonerPrinterStatsWidget } from "@/components/toner/TonerPrinterStatsWidget";

export default function TonerPage() {
    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6">
            {/* Printer List - Reuse for context */}
            <div className="w-full md:w-80 flex-none h-auto md:h-auto">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1">
                {/* Top Section: Unit Global Stats (Executive View) */}
                <div className="min-h-[350px] flex-none">
                    <TonerUnitStatsWidget />
                </div>

                {/* Bottom Section: Specific Printer Stats */}
                <div className="min-h-[350px] flex-none">
                    <TonerPrinterStatsWidget />
                </div>
            </div>
        </div>
    );
}
