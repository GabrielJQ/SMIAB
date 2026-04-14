import { create } from 'zustand';

export interface Message {
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface AiState {
    messages: Message[];
    isTyping: boolean;
    isOpen: boolean;
    isConnected: boolean;
    
    addMessage: (message: Message) => void;
    setTyping: (isTyping: boolean) => void;
    setOpen: (isOpen: boolean) => void;
    setConnected: (isConnected: boolean) => void;
    clearMessages: () => void;
}

export const useAiStore = create<AiState>((set) => ({
    messages: [
        {
            text: '¡Hola! Soy SMIAB AI. Puedo ayudarte con el estado de tus impresoras, consumos de tóner y reportes. ¿En qué puedo apoyarte hoy?',
            sender: 'ai',
            timestamp: new Date(),
        }
    ],
    isTyping: false,
    isOpen: false,
    isConnected: false,

    addMessage: (message) => set((state) => ({ 
        messages: [...state.messages, message] 
    })),
    
    setTyping: (isTyping) => set({ isTyping }),
    
    setOpen: (isOpen) => set({ isOpen }),
    
    setConnected: (isConnected) => set({ isConnected }),
    
    clearMessages: () => set({ 
        messages: [{
            text: 'Mensajes limpiados. ¿Deseas consultar algo más?',
            sender: 'ai',
            timestamp: new Date(),
        }] 
    }),
}));
