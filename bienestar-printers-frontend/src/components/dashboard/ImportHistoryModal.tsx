"use client";

import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, CalendarRange, FileCheck, FileSpreadsheet, Printer } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';

interface ImportHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const ImportHistoryModal = ({ isOpen, onClose, onSuccess }: ImportHistoryModalProps) => {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Por favor selecciona un archivo Excel');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('year', year.toString());
        formData.append('month', '1'); // Fixed value for API compatibility

        try {
            const { data } = await api.post('/printers/history/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (data.errors && data.errors.length > 0) {
                toast((t) => (
                    <div className="flex flex-col gap-2">
                        <p className="font-bold text-guinda-700">Importación parcial:</p>
                        <p className="text-xs">Procesados: {data.processed}</p>
                        <div className="max-h-20 overflow-y-auto text-[10px] text-slate-500 bg-slate-50 p-2 rounded">
                            {data.errors.map((err: string, i: number) => (
                                <p key={i}>• {err}</p>
                            ))}
                        </div>
                        <button 
                            onClick={() => toast.dismiss(t.id)}
                            className="text-[10px] uppercase font-black text-slate-400 self-end"
                        >
                            Cerrar
                        </button>
                    </div>
                ), { duration: 6000 });
            } else {
                toast.success(`¡Éxito! Se procesaron ${data.processed} registros.`);
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Upload error:', error);
            const message = error.response?.data?.message || 'Error al subir el archivo';
            toast.error(message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get(`/printers/history/template/${year}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SMIAB_Plantilla_${year}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('Descargando plantilla...');
        } catch (error) {
            console.error('Template download error:', error);
            toast.error('Error al descargar la plantilla');
        }
    };

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500"
                onClick={() => !isUploading && onClose()}
            />

            {/* Modal Content */}
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 fade-in duration-300 pointer-events-auto border border-white/20">
                {/* Header with Background Pattern */}
                <div className="relative bg-slate-900 px-8 py-10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-guinda-700/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-oro-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Importación Masiva</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">SMIAB Data Intelligence</p>
                        </div>
                        <button 
                            onClick={onClose}
                            disabled={isUploading}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white disabled:opacity-50 border border-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    {/* Multi-month info badge */}
                    <div className="bg-guinda-50/50 border border-guinda-100/50 rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-10 h-10 bg-guinda-700 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-guinda-700/20">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-guinda-900 uppercase tracking-wider">Instrucciones de Carga</p>
                            <p className="text-[10px] text-guinda-800 leading-relaxed font-medium">
                                El sistema omitirá las fechas manuales. Toda la información de <span className="font-black uppercase">Mes</span> y <span className="font-black uppercase">Año</span> debe estar presente en los encabezados o columnas de tu archivo Excel.
                            </p>
                        </div>
                    </div>

                    {/* File Upload Area */}
                    <div className="space-y-4">
                        <div 
                            className={`
                                relative border-2 border-dashed rounded-[2.5rem] p-12 transition-all group overflow-hidden
                                ${file ? 'border-oro-400 bg-oro-50/10' : 'border-slate-200 hover:border-guinda-700/30 hover:bg-slate-50'}
                            `}
                        >
                            <input 
                                type="file" 
                                accept=".xlsx"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                disabled={isUploading}
                            />
                            <div className="flex flex-col items-center text-center pointer-events-none relative z-10">
                                {file ? (
                                    <>
                                        <div className="w-20 h-20 bg-oro-100 rounded-[2rem] flex items-center justify-center mb-5 shadow-lg shadow-oro-200/50 transition-transform group-hover:scale-110">
                                            <FileCheck className="w-10 h-10 text-oro-600" />
                                        </div>
                                        <p className="text-lg font-black text-slate-800 truncate max-w-full px-4">{file.name}</p>
                                        <p className="text-[11px] font-black text-oro-600 uppercase tracking-[0.3em] mt-3">Archivo seleccionado</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-slate-100 group-hover:bg-guinda-50 rounded-[2rem] flex items-center justify-center mb-5 transition-all group-hover:scale-110">
                                            <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-guinda-700 transition-colors" />
                                        </div>
                                        <p className="text-lg font-black text-slate-600 group-hover:text-slate-900 transition-colors tracking-tight">Sube tu Excel de Producción</p>
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Detección automática de periodos</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Template Downloader Section */}
                    <div className="space-y-6 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Plantilla Maestra</label>
                            <div className="flex gap-2">
                                {years.map(y => (
                                    <button
                                        key={y}
                                        onClick={() => setYear(y)}
                                        className={`
                                            px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all border
                                            ${year === y 
                                                ? 'bg-guinda-700 text-white border-guinda-700 shadow-md shadow-guinda-700/20' 
                                                : 'bg-white text-slate-400 border-slate-200 hover:border-guinda-200 hover:text-guinda-700'}
                                        `}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleDownloadTemplate}
                            disabled={isUploading}
                            className="w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[10px] text-slate-500 hover:text-guinda-700 hover:bg-guinda-50 transition-all flex items-center justify-center gap-3 border border-slate-100"
                        >
                            <Upload className="w-4 h-4 rotate-180" />
                            Obtener Formato {year}
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-col gap-5">
                        <button 
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className={`
                                w-full py-6 rounded-[1.5rem] font-black uppercase tracking-[0.35em] text-[11px] transition-all flex items-center justify-center gap-3 shadow-xl
                                ${(!file || isUploading) 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                    : 'bg-guinda-700 text-white hover:bg-guinda-800 hover:scale-[1.02] active:scale-[0.98] shadow-guinda-700/40'}
                            `}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sincronizando Sistema...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Confirmar y Procesar
                                </>
                            )}
                        </button>
                        
                        <div className="flex items-center justify-center gap-2">
                             <div className="h-px bg-slate-100 flex-1" />
                             <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em] px-3">Secure Intelligence</p>
                             <div className="h-px bg-slate-100 flex-1" />
                        </div>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="h-2 w-full bg-gradient-to-r from-guinda-700 via-oro-400 to-guinda-700" />
            </div>
        </div>
    );
};
