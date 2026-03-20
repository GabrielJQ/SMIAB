"use client";

import React, { useState, useEffect } from 'react';
import { X, Mail, Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface RequestConsumableModalProps {
    isOpen: boolean;
    onClose: () => void;
    printerId: string;
    printerName: string;
    printerIp: string;
}

const getTokenEmail = () => {
    if (typeof window === 'undefined') return '';
    const token = sessionStorage.getItem('smiab_token');
    if (!token) return '';
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload).email || '';
    } catch (e) {
        return '';
    }
};

export const RequestConsumableModal: React.FC<RequestConsumableModalProps> = ({
    isOpen,
    onClose,
    printerId,
    printerName,
    printerIp
}) => {
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEmail(getTokenEmail());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!email || !email.includes('@')) {
            toast.error('Por favor, ingresa un correo electrónico válido');
            return;
        }

        setIsSending(true);
        const toastId = toast.loading('Enviando solicitud de captura...');

        try {
            await api.post(`/printers/${printerId}/request-consumables`, { email });
            toast.success('Solicitud enviada correctamente. Revisa tu correo.', { id: toastId });
            onClose();
        } catch (error: any) {
            console.error('Error sending consumable request:', error);
            const message = error.response?.data?.message || 'No se pudo conectar a la impresora seleccionada';
            toast.error(`Error: ${message}`, { id: toastId, duration: 5000 });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div 
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Decoration */}
                <div className="h-2 bg-gradient-to-r from-guinda-700 via-guinda-500 to-guinda-700" />
                
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Confirmar Solicitud</h3>
                            <p className="text-[10px] font-black text-guinda-600 uppercase tracking-widest mt-1">Reporte de Consumibles</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                <Send className="w-4 h-4 text-guinda-700" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Equipo Seleccionado</p>
                                <p className="text-sm font-bold text-slate-700">{printerName}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Se tomará una captura de pantalla del panel de control de la impresora (<span className="font-bold text-slate-600">{printerIp}</span>) y se enviará al correo especificado.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                Enviar reporte a:
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-guinda-600 transition-colors" />
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    className="w-full bg-white border-2 border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-guinda-500/30 focus:ring-4 focus:ring-guinda-500/5 transition-all outline-none shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-amber-800/80 leading-normal">
                                El proceso puede tardar hasta 15 segundos mientras se establece conexión con la impresora.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-slate-100 text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSend}
                            disabled={isSending || !email}
                            className={cn(
                                "flex-[2] py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg",
                                isSending || !email
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                    : "bg-guinda-700 text-white hover:bg-guinda-800 shadow-guinda-700/20"
                            )}
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Confirmar Envío
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
