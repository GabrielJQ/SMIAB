import { create } from 'zustand';
import { PrinterSummary } from '@/types/printer';

interface DashboardState {
    currentUnit: string | null;
    selectedPrinterId: string | null;
    selectedPrinter: PrinterSummary | null;

    setCurrentUnit: (unitId: string) => void;
    setSelectedPrinter: (printer: PrinterSummary | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    currentUnit: null,
    selectedPrinterId: null,
    selectedPrinter: null,

    setCurrentUnit: (unitId) => set({ currentUnit: unitId }),
    setSelectedPrinter: (printer) => set({
        selectedPrinter: printer,
        selectedPrinterId: printer?.id ?? null
    }),
}));
