import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    className?: string;
    valueClassName?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    className,
    valueClassName
}) => {
    return (
        <div className={cn(
            "bg-slate-50/70 p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm",
            "transition-all duration-300 hover:shadow-md hover:bg-white/80",
            className
        )}>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    {Icon && <Icon className="w-3 h-3 text-guinda-700" />}
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</div>
                </div>

                <div className={cn("text-3xl font-black text-slate-900 leading-none tracking-tight", valueClassName)}>
                    {value.toLocaleString()}
                </div>

                {(subtitle || trend) && (
                    <div className="flex items-center gap-2 mt-1">
                        {subtitle && <span className="text-[10px] font-bold text-slate-400 uppercase">{subtitle}</span>}
                        {trend && (
                            <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                trend.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                                {trend.value}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
