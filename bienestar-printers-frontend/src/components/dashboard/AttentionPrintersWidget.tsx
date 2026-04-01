'use client';

import React, { useState } from 'react';
import { useAttentionRequired, AttentionRequiredPrinter } from '@/hooks/useAttentionRequired';
import { AlertTriangle, ShieldAlert, Droplets, ArrowRight, CheckCircle2, Loader2, Info } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { ConfirmActionModal } from '@/components/ui/ConfirmActionModal';

/**
 * @component AttentionPrintersWidget
 * @description Widget de prioridad que muestra únicamente impresoras con alertas pendientes
 * o niveles críticos de consumibles. Permite la resolución rápida vía modal.
 */
export const AttentionPrintersWidget: React.FC = () => {
    const { data: alerts, isLoading, resolveAlert, isResolving } = useAttentionRequired();
    const [selectedAlert, setSelectedAlert] = useState<AttentionRequiredPrinter | null>(null);

    if (isLoading) {
        return (
            <DashboardCard className="min-h-[200px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-guinda-700 animate-spin" />
            </DashboardCard>
        );
    }

    if (!alerts || alerts.length === 0) {
        return (
            <DashboardCard className="p-6 flex flex-col items-center justify-center min-h-[200px] opacity-60 group border-dashed border-2 border-slate-100 hover:border-guinda-100 transition-colors">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-guinda-50 transition-colors">
                    <CheckCircle2 className="text-slate-300 group-hover:text-guinda-500 w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                    Sin alertas pendientes
                </p>
                <p className="text-[10px] text-slate-400 mt-1 italic font-medium">Todo bajo control</p>
            </DashboardCard>
        );
    }

    const handleResolve = async () => {
        if (selectedAlert) {
            await resolveAlert(selectedAlert.alertId);
            setSelectedAlert(null);
        }
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'SUSPICIOUS_SWAP': return <ShieldAlert className="text-red-500" size={16} />;
            case 'PREMATURE_CHANGE': return <AlertTriangle className="text-amber-500" size={16} />;
            default: return <Droplets className="text-guinda-600" size={16} />;
        }
    };

    const getAlertLabel = (type: string) => {
        switch (type) {
            case 'SUSPICIOUS_SWAP': return 'Cambio Sospechoso';
            case 'PREMATURE_CHANGE': return 'Cambio Prematuro';
            case 'TONER_LOW': return 'Tóner Bajo';
            default: return 'Atención Requerida';
        }
    };

    const getAlertColor = (type: string) => {
        switch (type) {
            case 'SUSPICIOUS_SWAP': return 'bg-red-50 text-red-700 border-red-100';
            case 'PREMATURE_CHANGE': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-guinda-50 text-guinda-700 border-guinda-100';
        }
    };

    const getAlertDescription = (alert: AttentionRequiredPrinter) => {
        const { type, metadata } = alert;
        const atDate = new Date(alert.createdAt).toLocaleString('es-MX', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        switch (type) {
            case 'SUSPICIOUS_SWAP':
                return (
                    <div className="space-y-4">
                        <p>Se ha detectado una caída drástica e inusual de nivel de tóner (Swap) en este equipo.</p>
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex justify-between items-center text-xs font-bold">
                            <span className="text-red-600 uppercase tracking-tighter">Nivel Anterior: {metadata.oldLevel}%</span>
                            <ArrowRight size={14} className="text-red-400" />
                            <span className="text-red-800 uppercase tracking-tighter">Nivel Actual: {metadata.newLevel}%</span>
                        </div>
                        <p className="text-[10px] italic">Detectado el {atDate}</p>
                    </div>
                );
            case 'PREMATURE_CHANGE':
                return (
                    <div className="space-y-4">
                        <p>Se realizó un cambio de cartucho cuando el anterior aún tenía una vida útil considerable (Desperdicio).</p>
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex justify-between items-center text-xs font-bold">
                            <span className="text-amber-600 uppercase tracking-tighter">Vida Restante: {metadata.oldLevel}%</span>
                            <ArrowRight size={14} className="text-amber-400" />
                            <span className="text-amber-800 uppercase tracking-tighter">Nuevo Cartucho: {metadata.newLevel}%</span>
                        </div>
                        <p className="text-[10px] italic">Detectado el {atDate}</p>
                    </div>
                );
            default:
                return (
                    <div className="space-y-4">
                        <p>El nivel de tóner ha llegado a un punto crítico ({metadata.level || alert.printer.tonerLevel}%) y requiere reposición inmediata.</p>
                        <p className="text-[10px] italic">Reportado el {atDate}</p>
                    </div>
                );
        }
    };

    return (
        <>
            <DashboardCard className="p-6 flex flex-col h-full bg-white relative overflow-hidden transition-all duration-300 hover:shadow-lg">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6 shrink-0">
                    <AlertTriangle className="w-4 h-4 text-guinda-600 animate-pulse" />
                    Atención Inmediata <span className="ml-auto bg-guinda-600 text-white px-2 py-0.5 rounded-full text-[10px] tracking-tight">{alerts.length}</span>
                </h3>

                <div className="space-y-3 flex-1 overflow-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 min-h-0">
                    {alerts.map((alert) => (
                        <div
                            key={alert.alertId}
                            onClick={() => setSelectedAlert(alert)}
                            className="group flex flex-col p-3 rounded-xl bg-white border border-slate-100 hover:border-guinda-200 hover:bg-guinda-50/20 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex flex-col min-w-0 pr-6">
                                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-tight truncate">
                                        {alert.printer.name}
                                    </span>
                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest truncate">
                                        {alert.printer.area}
                                    </span>
                                </div>
                                <div className={`shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center shadow-sm ${getAlertColor(alert.type)}`}>
                                    {getAlertIcon(alert.type)}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                                <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${getAlertColor(alert.type)}`}>
                                    {getAlertLabel(alert.type)}
                                </span>
                                <span className="text-[9px] font-bold text-guinda-600 uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Gestionar <ArrowRight size={10} />
                                </span>
                            </div>

                            {/* Indicador sutil de hover */}
                            <div className="absolute top-0 right-0 w-1 h-full bg-guinda-600 translate-x-full group-hover:translate-x-0 transition-transform" />
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 opacity-40 shrink-0">
                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.1em] italic">Prioridad de Activos - SMIAB </span>
                </div>
            </DashboardCard>

            {/* Modal de Resolución */}
            {selectedAlert && (
                <ConfirmActionModal
                    isOpen={!!selectedAlert}
                    onClose={() => setSelectedAlert(null)}
                    onConfirm={handleResolve}
                    title={getAlertLabel(selectedAlert.type)}
                    description={getAlertDescription(selectedAlert)}
                    confirmText="Atender e Ignorar"
                    cancelText="Cerrar"
                    isExecuting={isResolving}
                />
            )}
        </>
    );
};
