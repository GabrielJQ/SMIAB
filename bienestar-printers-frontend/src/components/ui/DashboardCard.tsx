import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
    children: React.ReactNode;
    className?: string;
    minHeight?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ children, className, minHeight = "min-h-[400px]" }) => {
    return (
        <div className={cn(
            "h-full bg-white/80 backdrop-blur-2xl rounded-[2.5rem]",
            "shadow-xl shadow-slate-200/50",
            "border-2 border-guinda-700/15", // Premium Guinda Border
            "p-8 flex flex-col relative group overflow-hidden",
            "transition-all duration-300 ease-in-out",
            "hover:shadow-2xl hover:-translate-y-1 hover:shadow-guinda-700/5", // Float effect
            minHeight,
            className
        )}>
            {/* Standard Background Decoration - Subtle Gradient Blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-guinda-50/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Content Wrapper */}
            <div className="relative z-10 flex-1 flex flex-col w-full h-full">
                {children}
            </div>
        </div>
    );
};
