"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CHART_DEFAULTS } from '@/lib/constants';

interface BaseBarChartProps {
    data: any[];
    dataKey: string;
    nameKey?: string;
    colorKey?: string; // If data items have specific colors
    height?: number | string;
    barSize?: number;
    showXAxis?: boolean;
    showYAxis?: boolean;
    tooltipContent?: (props: any) => React.ReactNode;
    children?: React.ReactNode; // For defs, additional lines, etc.
}

export const BaseBarChart: React.FC<BaseBarChartProps> = ({
    data,
    dataKey,
    nameKey = "name",
    colorKey = "color",
    height = "100%",
    barSize,
    showXAxis = true,
    showYAxis = true,
    tooltipContent,
    children
}) => {
    return (
        <ResponsiveContainer width="100%" height={height as any}>
            <BarChart
                data={data}
                margin={{ left: 0, right: 0, top: 10, bottom: 20 }}
                barSize={barSize}
            >
                {children}

                <CartesianGrid vertical={false} stroke={CHART_DEFAULTS.gridStroke} strokeDasharray="3 3" />

                {showXAxis && (
                    <XAxis
                        dataKey={nameKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 700, fill: CHART_DEFAULTS.tickFill }}
                        dy={15}
                    />
                )}

                {showYAxis && (
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 700, fill: CHART_DEFAULTS.tickFill }}
                        width={40}
                        allowDecimals={false}
                    />
                )}

                <Tooltip
                    cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                    content={tooltipContent}
                />

                <Bar
                    dataKey={dataKey}
                    radius={CHART_DEFAULTS.barRadius}
                    animationDuration={CHART_DEFAULTS.animationDuration}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry[colorKey] || '#0f172a'}
                            className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};
