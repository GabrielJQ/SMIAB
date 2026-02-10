"use client";

import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { PrinterDetailWidget } from "@/components/dashboard/PrinterDetailWidget";

export default function PrintersPage() {
    return (
        <div className="flex flex-col h-screen md:h-[calc(100vh-7rem)] pt-20 md:pt-0">
            <MobileNav />
            <div className="flex flex-1 overflow-hidden gap-6 relative">
                <Sidebar />

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-1 w-full">
                    <div className="min-h-full">
                        <PrinterDetailWidget />
                    </div>
                </div>
            </div>
        </div>
    );
}
