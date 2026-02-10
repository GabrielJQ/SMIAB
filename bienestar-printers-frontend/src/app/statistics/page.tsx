"use client";

import React from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { GeneralStatsWidget } from "@/components/dashboard/GeneralStatsWidget";
import { PrinterHistoryWidget } from "@/components/dashboard/PrinterHistoryWidget";

export default function StatisticsPage() {
    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6">
            {/* Printer List - Context */}
            <div className="w-full md:w-80 flex-none h-full md:h-full">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1">
                {/* Top Section: Unit Global Stats (Print/Copy) */}
                <div className="min-h-[350px] flex-none">
                    <GeneralStatsWidget />
                </div>

                {/* Bottom Section: Specific Printer Stats */}
                <div className="min-h-[350px] flex-none">
                    <PrinterHistoryWidget />
                </div>
            </div>
        </div>
    );
}
