'use client';

import React from 'react';
import { useUnitTopCombined } from '@/hooks/useUnitTopCombined';
import { Activity, Droplets } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';

/**
 * @component TopConsumersWidget
 * @description Versión rediseñada del widget de consumidores para integrarse perfectamente
 * con la estética original de SMIAB. Combina volumen de impresión y tóners.
 */
export const TopConsumersWidget: React.FC = () => {
    const { data: response, isLoading } = useUnitTopCombined();
    const printers = response?.data || [];
    const periodLabel = response?.periodLabel || '';

    if (isLoading) {
        return (
            <DashboardCard className="min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-guinda-700 rounded-full animate-spin"></div>
            </DashboardCard>
        );
    }

    return (
        <DashboardCard className="p-6 flex flex-col min-h-[450px] h-full">
            {/* Header exacto según referencia */}
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-8 shrink-0">
                <Activity className="w-4 h-4 text-guinda-700" />
                Top Consumidores {periodLabel && <span className="text-slate-300">— {periodLabel}</span>}
            </h3>

            <div className="overflow-hidden space-y-10 pr-1 flex-grow">
                {(printers.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <Activity className="w-12 h-12 text-slate-300 mb-4" />
                        <p className="text-sm font-black text-slate-300 uppercase tracking-widest text-center">
                            Sin datos en el periodo
                        </p>
                    </div>
                ) : (
                    printers.map((printer, idx) => {
                        const maxImpressions = printers[0].impressions || 1;
                        // Buscamos el máximo de cambios de tóner para normalizar su barra también
                        const maxToners = Math.max(...printers.map(p => p.tonerChanges)) || 1;

                        const printPercentage = (printer.impressions / maxImpressions) * 100;
                        const tonerPercentage = (printer.tonerChanges / maxToners) * 100;

                        return (
                            <div key={printer.printerId} className="flex flex-col gap-4 shrink-0 group">
                                {/* Encabezado de Impresora */}
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-black text-slate-700 uppercase tracking-tight">
                                        {idx + 1}. {printer.name}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                    {/* Métrica 1: Impresiones (Guinda) */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                            <div className="flex items-center gap-1.5 text-guinda-700">
                                                <Activity size={12} />
                                                <span>Impresiones</span>
                                            </div>
                                            <span className="text-slate-600 italic">{printer.impressions.toLocaleString()} pág.</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className="h-full bg-guinda-700 rounded-full transition-all duration-700 ease-out"
                                                style={{ width: `${printPercentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Métrica 2: Tóners (Slate/Azul) */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Droplets size={12} />
                                                <span>Consumo Tóner</span>
                                            </div>
                                            <span className="text-slate-600 italic">{printer.tonerChanges} camb.</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className="h-full bg-slate-400 rounded-full transition-all duration-700 ease-out"
                                                style={{ width: `${tonerPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer con descripción funcional */}
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-start opacity-50">
                <span className="text-[10px] font-medium text-slate-400 italic leading-relaxed">
                    Métricas de los 5 equipos con mayor demanda de impresiones y reemplazos de tóner en el mes consolidado.
                </span>
            </div>
        </DashboardCard>
    );
};
