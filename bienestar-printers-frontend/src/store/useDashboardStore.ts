import { create } from 'zustand';
import { PrinterSummary } from '@/types/printer';

interface DashboardState {
    currentUnit: string | null;
    unitName: string | null;
    selectedPrinterId: string | null;
    selectedPrinter: PrinterSummary | null;
    isMobileMenuOpen: boolean;

    setCurrentUnit: (unitId: string | null) => void;
    setUnitName: (name: string | null) => void;
    setSelectedPrinter: (printer: PrinterSummary | null) => void;
    setMobileMenuOpen: (isOpen: boolean) => void;
    toggleMobileMenu: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    currentUnit: null,
    unitName: null,
    selectedPrinterId: null,
    selectedPrinter: null,
    isMobileMenuOpen: false,

    setCurrentUnit: (unitId) => set({ currentUnit: unitId }),
    setUnitName: (name) => set({ unitName: name }),
    setSelectedPrinter: (printer) => set({
        selectedPrinter: printer,
        selectedPrinterId: printer?.id ?? null
    }),
    setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
    toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
}));
