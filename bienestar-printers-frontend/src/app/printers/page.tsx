"use client";

import React from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { PrinterDetailWidget } from "@/components/dashboard/PrinterDetailWidget";
import { PrinterHistoryWidget } from "@/components/dashboard/PrinterHistoryWidget";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function PrintersPage() {
    const { selectedPrinterId } = useDashboardStore();

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6">
            {/* Printer List - Adapted from Sidebar */}
            <div className="w-full md:w-80 flex-none h-auto md:h-auto">
                <Sidebar />
            </div>

            {/* Printer Details - Scrollable Area */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1">
                {/* Top Section: History */}
                <div className="min-h-[350px]">
                    <PrinterHistoryWidget />
                </div>

                {/* Bottom Section: Technical Details */}
                <div className="min-h-[300px]">
                    <PrinterDetailWidget />
                </div>
            </div>
        </div>
    );
}
