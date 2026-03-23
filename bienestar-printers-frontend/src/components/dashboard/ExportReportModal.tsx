"use client";

import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Loader2, CalendarRange, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { useExportModalStore } from '@/store/useExportModalStore';
import { MONTH_NAMES } from '@/lib/constants';

export const ExportReportModal = () => {
    const { isOpen, closeExportModal } = useExportModalStore();
    const now = new Date();
    
    const [type, setType] = useState<'monthly' | 'yearly'>('monthly');
    const [year, setYear] = useState(now.getFullYear());
    // JS months are 0-indexed, but our API uses 1-indexed. Default to current month.
    const [month, setMonth] = useState(now.getMonth() + 1); 
    const [isDownloading, setIsDownloading] = useState(false);

    if (!isOpen) return null;

    const currentYear = now.getFullYear();
    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

    const handleDownload = async () => {
        setIsDownloading(true);
        toast.loading('Generando reporte Excel...', { id: 'export-toast' });
        
        try {
            const endpoint = `/reports/export/excel?type=${type}&year=${year}${type === 'monthly' ? `&month=${month}` : ''}`;
            const response = await api.get(endpoint, {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = `Reporte_SMIAB_${type === 'monthly' ? 'Mensual' : 'Anual'}_${year}${type === 'monthly' ? `_${month}` : ''}.xlsx`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('Reporte descargado correctamente', { id: 'export-toast' });
            closeExportModal();
        } catch (error: any) {
            console.error('Export error:', error);
            const message = 'Error al generar el reporte';
            toast.error(message, { id: 'export-toast' });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500"
                onClick={() => !isDownloading && closeExportModal()}
            />

            {/* Modal Content */}
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 fade-in duration-300 pointer-events-auto border border-white/20">
                {/* Header with Background Pattern */}
                <div className="relative bg-slate-900 px-8 py-10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-oro-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-guinda-700/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Exportar Reporte</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">SMIAB Data Export</p>
                        </div>
                        <button 
                            onClick={closeExportModal}
                            disabled={isDownloading}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white disabled:opacity-50 border border-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    {/* Select Report Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setType('monthly')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2
                                ${type === 'monthly' 
                                    ? 'border-guinda-700 bg-guinda-50 text-guinda-900 shadow-md shadow-guinda-700/10' 
                                    : 'border-slate-100 bg-white text-slate-400 hover:border-guinda-200 hover:text-guinda-700'}`}
                        >
                            <CalendarRange className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Mensual</span>
                        </button>
                        <button
                            onClick={() => setType('yearly')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2
                                ${type === 'yearly' 
                                    ? 'border-oro-500 bg-oro-50 text-oro-900 shadow-md shadow-oro-500/10' 
                                    : 'border-slate-100 bg-white text-slate-400 hover:border-oro-200 hover:text-oro-600'}`}
                        >
                            <FileSpreadsheet className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Anual</span>
                        </button>
                    </div>

                    {/* Selectors */}
                    <div className="space-y-4">
                        {type === 'monthly' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mes de Corte</label>
                                <select 
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="w-full bg-slate-50 border-2 border-slate-100 text-slate-700 text-sm font-bold rounded-2xl px-4 py-3 outline-none focus:border-guinda-500 focus:bg-white transition-all uppercase tracking-wider"
                                >
                                    {MONTH_NAMES.map((name, index) => (
                                        <option key={index + 1} value={index + 1}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Año Fiscal</label>
                            <select 
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-full bg-slate-50 border-2 border-slate-100 text-slate-700 text-sm font-bold rounded-2xl px-4 py-3 outline-none focus:border-guinda-500 focus:bg-white transition-all uppercase tracking-wider"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-col gap-5">
                        <button 
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className={`
                                w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.35em] text-[11px] transition-all flex items-center justify-center gap-3 shadow-xl
                                ${isDownloading 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                    : 'bg-guinda-700 text-white hover:bg-guinda-800 hover:scale-[1.02] active:scale-[0.98] shadow-guinda-700/40'}
                            `}
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Exportando Excel...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Descargar Reporte
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="h-2 w-full bg-gradient-to-r from-guinda-700 via-oro-400 to-guinda-700" />
            </div>
        </div>
    );
};
