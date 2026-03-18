import { create } from 'zustand';

interface ModalState {
    isImportModalOpen: boolean;
    onImportSuccess?: () => void;
    
    openImportModal: (onSuccess?: () => void) => void;
    closeImportModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    isImportModalOpen: false,
    onImportSuccess: undefined,

    openImportModal: (onSuccess) => set({ 
        isImportModalOpen: true, 
        onImportSuccess: onSuccess 
    }),
    closeImportModal: () => set({ 
        isImportModalOpen: false, 
        onImportSuccess: undefined 
    }),
}));
