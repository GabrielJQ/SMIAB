import { api } from './api';
import { TonerHistoryDto } from '../types/toner';

export const tonerService = {
    getUnitHistory: async (months: number = 6): Promise<TonerHistoryDto[]> => {
        const { data } = await api.get('/toners/unit/history', { params: { months } });
        return data;
    },

    getPrinterHistory: async (printerId: string, months: number = 6): Promise<TonerHistoryDto[]> => {
        const { data } = await api.get(`/toners/printer/${printerId}/history`, { params: { months } });
        return data;
    }
};
