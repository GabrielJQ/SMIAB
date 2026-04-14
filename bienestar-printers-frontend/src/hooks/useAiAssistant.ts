import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useAiStore, Message } from '@/store/useAiStore';

/**
 * @hook useAiAssistant
 * @description Maneja la conexión de WebSockets con el backend de IA.
 * Escucha eventos de mensajes y estado de escritura, y provee la función para enviar prompts.
 */
export const useAiAssistant = () => {
    const socketRef = useRef<Socket | null>(null);
    const { currentUnit } = useDashboardStore();
    const { addMessage, setTyping, messages, setConnected } = useAiStore();

    useEffect(() => {
        if (!currentUnit) return;

        // Recuperar el token correcto desde sessionStorage
        const token = sessionStorage.getItem('smiab_token');

        if (!token) {
            console.warn('SMIAB AI: No se encontró token de sesión. Reintentando...');
            return;
        }

        // Conectar al namespace 'ai-assistant'
        const socket = io('/ai-assistant', {
            auth: {
                token: token,
            },
            query: {
                unitId: currentUnit
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('SMIAB AI: Connected');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('SMIAB AI: Disconnected');
            setConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('SMIAB AI Connect Error:', err.message);
            setConnected(false);
        });

        socket.on('ai_typing', (data: { status: boolean }) => {
            setTyping(data.status);
        });

        socket.on('receive_message', (message: Message) => {
            addMessage(message);
        });

        socket.on('error', (err) => {
            console.error('SMIAB AI Error:', err);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [currentUnit, addMessage, setTyping, setConnected]);

    const sendMessage = (text: string) => {
        if (!text.trim() || !currentUnit) return;

        const cleanPrompt = text.trim();

        // 1. Construir historial válido ANTES de añadir el nuevo mensaje al store
        // Esto evita enviar el prompt actual duplicado en el historial.
        const firstUserIndex = messages.findIndex(m => m.sender === 'user');
        const validHistory = firstUserIndex !== -1 ? messages.slice(firstUserIndex) : [];

        // 2. Añadir mensaje del usuario localmente para la UI
        const userMessage: Message = {
            text: cleanPrompt,
            sender: 'user',
            timestamp: new Date(),
        };
        addMessage(userMessage);

        if (!socketRef.current || !socketRef.current.connected) {
            console.warn('SMIAB AI: Socket not connected, message stored but not sent');
            return;
        }

        // 3. Enviar al servidor con historial optimizado (últimos 4 turnos para ahorrar cuota)
        socketRef.current.emit('send_message', {
            prompt: cleanPrompt,
            unitId: currentUnit,
            history: validHistory.slice(-4).map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }))
        });
    };

    return { sendMessage };
};
