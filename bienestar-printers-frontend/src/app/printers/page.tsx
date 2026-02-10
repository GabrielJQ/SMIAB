"use client";

import React from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { PrinterDetailWidget } from "@/components/dashboard/PrinterDetailWidget";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function PrintersPage() {
    const { selectedPrinterId } = useDashboardStore();

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6">
            {/* Printer List - Reuse for context */}
            <div className="w-full md:w-80 flex-none h-full md:h-full">
                <Sidebar />
            </div>

            {/* Main Content - Printer Details Focused */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-1">
                <div className="min-h-full">
                    <PrinterDetailWidget />
                </div>
            </div>
        </div>
    );
}
