"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tonerService } from '@/services/tonerService';
import { Droplet, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { UnifiedFilter } from '@/components/dashboard/UnifiedFilter';
import { BaseBarChart } from '@/components/ui/charts/BaseBarChart';
import { CHART_COLORS, MONTH_NAMES } from '@/lib/constants';

interface TonerUnitStatsWidgetProps {
    compact?: boolean;
}

export const TonerUnitStatsWidget: React.FC<TonerUnitStatsWidgetProps> = ({ compact = false }) => {
    const [range, setRange] = useState(1);

    const { data: history, isLoading } = useQuery({
        queryKey: ['toner-unit-history', range],
        queryFn: () => tonerService.getUnitHistory(range),
    });

    const chartData = React.useMemo(() => {
        if (!history) return [];
        return history.map((item, index) => ({
            name: `${MONTH_NAMES[item.month - 1]}`,
            fullName: `${MONTH_NAMES[item.month - 1]} ${item.year}`,
            value: item.toner_count,
            color: CHART_COLORS[index % CHART_COLORS.length]
        }));
    }, [history]);

    const totalConsumed = React.useMemo(() => {
        return history?.reduce((acc, curr) => acc + curr.toner_count, 0) || 0;
    }, [history]);

    if (isLoading) return (
        <DashboardCard className={cn("flex items-center justify-center", compact ? "min-h-[200px]" : "min-h-[350px]")}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-guinda-700 rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Analizando...</p>
            </div>
        </DashboardCard>
    );

    return (
        <DashboardCard className="min-h-[400px]">
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 relative z-10 gap-4">
                <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Droplet className="w-4 h-4 text-guinda-700" />
                        Consumo Global
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-slate-900 leading-none tracking-tighter">
                            {totalConsumed.toLocaleString()}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                Cartuchos
                            </span>
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                +2.4%
                            </span>
                        </div>
                    </div>
                </div>

                {!compact && (
                    <div className="relative z-20 w-full md:w-auto">
                        <UnifiedFilter value={range} onChange={setRange} />
                    </div>
                )}
            </div>

            <div className="w-full h-[300px] mt-4 relative z-10">
                {chartData.length > 0 ? (
                    <BaseBarChart
                        data={chartData}
                        dataKey="value"
                        barSize={compact ? 30 : 60}
                        tooltipContent={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 ring-1 ring-slate-100/50">
                                        <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-wider">{data.fullName}</p>
                                        <p className="text-2xl font-black text-slate-800 flex items-baseline gap-1" style={{ color: data.color }}>
                                            {data.value} <span className="text-[10px] text-slate-400 font-bold uppercase">Uds.</span>
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    >
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7B1E34" stopOpacity={1} />
                                <stop offset="100%" stopColor="#7B1E34" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>
                    </BaseBarChart>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <Droplet className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Sin datos registrados</p>
                    </div>
                )}
            </div>
        </DashboardCard>
    );
};
