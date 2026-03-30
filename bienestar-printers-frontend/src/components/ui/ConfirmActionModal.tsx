import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isExecuting?: boolean;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isExecuting = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={!isExecuting ? onClose : undefined}
            />
            
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-guinda-50 flex items-center justify-center border border-guinda-100">
                            <AlertTriangle className="w-6 h-6 text-guinda-700" />
                        </div>
                        <div className="flex-1 mt-1">
                            <h3 className="text-xl font-black text-slate-800 leading-tight tracking-tight">
                                {title}
                            </h3>
                            <div className="mt-3 text-sm text-slate-500 leading-relaxed font-medium">
                                {description}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50/80 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100/50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isExecuting}
                        className="px-5 py-2.5 rounded-xl text-xs font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-200 hover:text-slate-800 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isExecuting}
                        className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-guinda-700 hover:bg-guinda-800 uppercase tracking-[0.2em] transition-all shadow-[0_4px_12px_rgba(123,30,52,0.3)] hover:shadow-[0_6px_16px_rgba(123,30,52,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isExecuting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isExecuting ? 'Procesando...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
