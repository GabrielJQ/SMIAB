"use client";

import React from 'react';
import { useModalStore } from '@/store/useModalStore';
import { ImportHistoryModal } from './ImportHistoryModal';
import { ExportReportModal } from './ExportReportModal';

export const GlobalModalContainer = () => {
    const { isImportModalOpen, closeImportModal, onImportSuccess } = useModalStore();

    return (
        <>
            <ImportHistoryModal 
                isOpen={isImportModalOpen} 
                onClose={closeImportModal} 
                onSuccess={() => {
                    if (onImportSuccess) onImportSuccess();
                }} 
            />
            <ExportReportModal />
        </>
    );
};
