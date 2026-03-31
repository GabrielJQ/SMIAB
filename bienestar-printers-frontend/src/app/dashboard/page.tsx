"use client";

import { UnitStatusWidget } from "@/components/dashboard/UnitStatusWidget";
import { GeneralStatsWidget } from "@/components/dashboard/GeneralStatsWidget";
import { TonerUnitStatsWidget } from "@/components/toner/TonerUnitStatsWidget";
import { TopConsumersWidget } from "@/components/dashboard/TopConsumersWidget";

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-6 flex-1 min-h-0">
            <div className="flex flex-col md:flex-row gap-6 items-stretch flex-none">
                {/* Executive Summary - Unit Status */}
                <div className="flex-1">
                    <UnitStatusWidget />
                </div>

                {/* Global Stats - General History */}
                <div className="flex-[1.5]">
                    <GeneralStatsWidget />
                </div>
            </div>

            {/* Analysis & Top Consumers Section */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1 min-h-0">
                {/* Top Combined Consumers (Izquierda) */}
                <div className="lg:flex-1">
                    <TopConsumersWidget />
                </div>

                {/* Global Historical Toner Consumption (Derecha) */}
                <div className="flex-[1.5]">
                    <TonerUnitStatsWidget />
                </div>
            </div>
        </div>
    );
}
