"use client";

import { UnitStatusWidget } from "@/components/dashboard/UnitStatusWidget";
import { GeneralStatsWidget } from "@/components/dashboard/GeneralStatsWidget";
import { TonerUnitStatsWidget } from "@/components/toner/TonerUnitStatsWidget";

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-6 flex-1 min-h-0">
            <div className="flex flex-col md:flex-row gap-6 flex-none">
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
            <div className="flex-1 min-h-[300px]">
                <TonerUnitStatsWidget />
            </div>
        </div>
    );
}
