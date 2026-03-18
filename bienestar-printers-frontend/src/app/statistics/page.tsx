"use client";

import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { GeneralStatsWidget } from "@/components/dashboard/GeneralStatsWidget";
import { PrinterHistoryWidget } from "@/components/dashboard/PrinterHistoryWidget";
import { TopPrintingVolumeWidget } from "@/components/toner/TopPrintingVolumeWidget";

export default function StatisticsPage() {
    return (
        <div className="flex flex-col h-screen md:h-[calc(100vh-7rem)] pt-20 md:pt-0">
            <MobileNav />
            <div className="flex flex-1 overflow-hidden gap-6 relative">
                <Sidebar />

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-full">
                        {/* Left Column (Charts) */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* Top Section: Unit Global Stats (Print/Copy) */}
                            <div className="min-h-[350px] flex-none">
                                <GeneralStatsWidget />
                            </div>

                            {/* Bottom Section: Specific Printer Stats */}
                            <div className="min-h-[350px] flex-none">
                                <PrinterHistoryWidget />
                            </div>
                        </div>

                        {/* Right Column (Widgets) */}
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <TopPrintingVolumeWidget />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
