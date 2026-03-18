import { api } from './api';
import { TonerHistoryDto } from '../types/toner';

export const tonerService = {
    getUnitHistory: async (year: number, month: number): Promise<TonerHistoryDto[]> => {
        const { data } = await api.get('/toners/unit/history', { params: { year, month } });
        return data;
    },

    getPrinterHistory: async (printerId: string, year: number, month: number): Promise<TonerHistoryDto[]> => {
        const { data } = await api.get(`/toners/printer/${printerId}/history`, { params: { year, month } });
        return data;
    }
};
