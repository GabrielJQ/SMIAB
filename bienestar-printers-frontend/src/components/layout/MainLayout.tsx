"use client";

import React from 'react';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen w-full bg-slate-50/50 text-slate-900 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 w-full mx-auto px-4 py-6 animate-in fade-in duration-500 flex flex-col min-h-0">
                {children}
            </main>
        </div>
    );
};
