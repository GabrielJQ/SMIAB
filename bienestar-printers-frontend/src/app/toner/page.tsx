"use client";

import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TonerUnitStatsWidget } from "@/components/toner/TonerUnitStatsWidget";
import { TonerPrinterStatsWidget } from "@/components/toner/TonerPrinterStatsWidget";

export default function TonerPage() {
    return (
        <div className="flex flex-col h-screen md:h-[calc(100vh-7rem)] pt-20 md:pt-0">
            <MobileNav />
            <div className="flex flex-1 overflow-hidden gap-6 relative">
                <Sidebar />

                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1 w-full">
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
        </div>
    );
}
