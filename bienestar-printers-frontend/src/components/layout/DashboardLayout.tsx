import React from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen w-full bg-slate-50 text-slate-900">
            <Sidebar />
            <main className="flex-1 overflow-hidden p-6 relative">
                <div className="h-full w-full max-w-7xl mx-auto flex flex-col">
                    {children}
                </div>
            </main>
        </div>
    );
};
