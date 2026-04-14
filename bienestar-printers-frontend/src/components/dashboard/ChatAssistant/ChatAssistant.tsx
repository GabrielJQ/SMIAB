'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, MessageSquare, Trash2, Sparkles } from 'lucide-react';
import { useAiStore } from '@/store/useAiStore';
import { useAiAssistant } from '@/hooks/useAiAssistant';
import { clsx } from 'clsx';

/**
 * @component ChatAssistant
 * @description Interfaz de chat flotante con estética premium.
 * Soporta scroll automático, indicadores de escritura y diseño responsivo.
 */
export const ChatAssistant: React.FC = () => {
    const { messages, isTyping, isOpen, isConnected, setOpen, clearMessages } = useAiStore();
    const { sendMessage } = useAiAssistant();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isTyping, isOpen]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-guinda-700 hover:bg-guinda-800 text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 z-50 group"
                title="SMIAB AI Assistant"
            >
                <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                    IA
                </span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden z-50 transition-all animate-in fade-in slide-in-from-bottom-10 duration-300">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-guinda-700 to-guinda-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl relative">
                        <Bot size={24} />
                        <span className={clsx(
                            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-guinda-800",
                            isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                        )} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                            SMIAB AI <Sparkles size={14} className="text-yellow-300" />
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] opacity-80 uppercase tracking-widest font-semibold">
                            <span>Asistente Virtual</span>
                            <span className="opacity-50">•</span>
                            <span className={isConnected ? "text-green-300" : "text-red-300"}>
                                {isConnected ? "En línea" : "Desconectado"}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={clearMessages}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-70 hover:opacity-100"
                        title="Limpiar chat"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button 
                        onClick={() => setOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
                {messages.map((msg, idx) => (
                    <div 
                        key={idx}
                        className={clsx(
                            "flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2",
                            msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <div className={clsx(
                            "p-2 rounded-lg shrink-0",
                            msg.sender === 'user' ? "bg-guinda-50 text-guinda-600" : "bg-gray-100 text-gray-500"
                        )}>
                            {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={clsx(
                            "max-w-[80%] p-3 text-sm shadow-sm",
                            msg.sender === 'user' 
                                ? "bg-guinda-700 text-white rounded-2xl rounded-tr-none" 
                                : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none"
                        )}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            <span className={clsx(
                                "text-[9px] block mt-1 opacity-60",
                                msg.sender === 'user' ? "text-right" : "text-left"
                            )}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                
                {isTyping && (
                    <div className="flex items-start gap-2 animate-pulse">
                        <div className="p-2 bg-gray-100 text-gray-500 rounded-lg shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-gray-100 rounded-2xl rounded-tl-none p-3 flex gap-1">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <div className="relative flex items-center bg-white border border-gray-200 rounded-2xl p-2 shadow-sm focus-within:ring-2 ring-guinda-500/20 transition-all">
                    <textarea 
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Pregúntame algo..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-1 px-3 resize-none max-h-32 text-gray-800 placeholder:text-gray-400"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                        className={clsx(
                            "p-2 rounded-xl transition-all",
                            !inputValue.trim() || isTyping 
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                : "bg-guinda-700 text-white hover:bg-guinda-800 shadow-lg shadow-guinda-500/20"
                        )}
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p className="text-[9px] text-center mt-3 text-gray-400 uppercase tracking-tighter">
                    Powered by Google Gemini 2.0 • Dashboard Intelligence
                </p>
            </div>
        </div>
    );
};
