"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isScrolling, setIsScrolling] = React.useState(false);
    const scrollTimeoutRef = React.useRef<any>(null);

    const handleScroll = () => {
        if (!isScrolling) setIsScrolling(true);

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 text-slate-900">
            <Sidebar />
            <main
                className={cn(
                    "flex-1 overflow-y-auto md:overflow-hidden p-4 md:p-6 relative",
                    // Apply custom scrollbar mainly for mobile where it flows, or if content overflows desktop
                    "overflow-y-auto custom-scrollbar",
                    isScrolling && "is-scrolling"
                )}
                onScroll={handleScroll}
            >
                <div className="h-full w-full max-w-7xl mx-auto flex flex-col">
                    {children}
                </div>
            </main>
        </div>
    );
};
