import { create } from 'zustand';
import { PrinterSummary } from '@/types/printer';

interface DashboardState {
    currentUnit: string | null;
    selectedPrinterId: string | null;
    selectedPrinter: PrinterSummary | null;
    isMobileMenuOpen: boolean;

    setCurrentUnit: (unitId: string) => void;
    setSelectedPrinter: (printer: PrinterSummary | null) => void;
    setMobileMenuOpen: (isOpen: boolean) => void;
    toggleMobileMenu: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    currentUnit: null,
    selectedPrinterId: null,
    selectedPrinter: null,
    isMobileMenuOpen: false,

    setCurrentUnit: (unitId) => set({ currentUnit: unitId }),
    setSelectedPrinter: (printer) => set({
        selectedPrinter: printer,
        selectedPrinterId: printer?.id ?? null
    }),
    setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
    toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
}));
