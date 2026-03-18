import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthYearFilterProps {
    month: number; // 1-12
    year: number;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
    className?: string;
}

export const MonthYearFilter: React.FC<MonthYearFilterProps> = ({ 
    month, 
    year, 
    onMonthChange, 
    onYearChange, 
    className 
}) => {
    const months = [
        { value: 1, label: 'Enero' },
        { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Mayo' },
        { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' },
        { value: 12, label: 'Diciembre' },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

    const selectClass = cn(
        "appearance-none cursor-pointer",
        "bg-white border-2 border-guinda-700/10",
        "py-2 rounded-xl",
        "text-[10px] font-black text-slate-600 uppercase tracking-widest",
        "shadow-sm transition-all duration-200",
        "hover:border-guinda-700/30 hover:bg-guinda-50/30",
        "focus:outline-none focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500",
        "outline-none"
    );

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Mes Selector */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-20">
                    <Calendar className="w-3.5 h-3.5 text-guinda-700" />
                </div>
                <select
                    value={month}
                    onChange={(e) => onMonthChange(Number(e.target.value))}
                    className={cn(selectClass, "pl-9 pr-8")}
                >
                    {months.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400 group-hover:text-guinda-600 transition-colors z-20">
                    <ChevronDown className="w-3.5 h-3.5" />
                </div>
            </div>

            {/* Año Selector */}
            <div className="relative group">
                <select
                    value={year}
                    onChange={(e) => onYearChange(Number(e.target.value))}
                    className={cn(selectClass, "px-4 pr-8")}
                >
                    {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400 group-hover:text-guinda-600 transition-colors z-20">
                    <ChevronDown className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );
};
