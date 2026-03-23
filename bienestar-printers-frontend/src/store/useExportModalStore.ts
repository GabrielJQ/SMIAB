import { create } from 'zustand';

interface ExportModalState {
  isOpen: boolean;
  openExportModal: () => void;
  closeExportModal: () => void;
}

export const useExportModalStore = create<ExportModalState>((set) => ({
  isOpen: false,
  openExportModal: () => set({ isOpen: true }),
  closeExportModal: () => set({ isOpen: false }),
}));
