import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedFilterProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
}

export const UnifiedFilter: React.FC<UnifiedFilterProps> = ({ value, onChange, className }) => {
    return (
        <div className={cn("relative group", className)}>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-20">
                <Calendar className="w-3.5 h-3.5 text-guinda-700" />
            </div>

            <select
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className={cn(
                    "appearance-none cursor-pointer",
                    "bg-white border-2 border-guinda-700/10", // Glassy subtle border
                    "pl-9 pr-10 py-2 rounded-xl",
                    "text-[10px] font-black text-slate-600 uppercase tracking-widest",
                    "shadow-sm transition-all duration-200",
                    "hover:border-guinda-700/30 hover:bg-guinda-50/30", // Hover state
                    "focus:outline-none focus:ring-2 focus:ring-guinda-500/20 focus:border-guinda-500",
                    "outline-none"
                )}
            >
                <option value={1}>Este Mes</option>
                <option value={2}>Bimestre</option>
                <option value={6}>Semestre</option>
                <option value={12}>Año</option>
            </select>

            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 group-hover:text-guinda-600 transition-colors z-20">
                <ChevronDown className="w-3.5 h-3.5" />
            </div>
        </div>
    );
};
