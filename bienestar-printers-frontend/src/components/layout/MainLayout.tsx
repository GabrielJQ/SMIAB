"use client";

import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { useDashboardStore } from '@/store/useDashboardStore';
import { ChatAssistant } from '../dashboard/ChatAssistant/ChatAssistant';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { setUnitName, setCurrentUnit } = useDashboardStore();

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const { data } = await api.get('/auth/me');
                if (data?.unitId) {
                    setCurrentUnit(data.unitId);
                }
                if (data?.internal?.unit_name) {
                    setUnitName(data.internal.unit_name);
                }
            } catch (error) {
                console.error('Error fetching user info for dynamic identity:', error);
            }
        };

        fetchUserInfo();
    }, [setUnitName]);

    return (
        <div className="min-h-screen w-full bg-slate-50/50 text-slate-900 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 w-full mx-auto px-4 py-6 animate-in fade-in duration-500 flex flex-col min-h-0">
                {children}
            </main>
            <ChatAssistant />
        </div>
    );
};
