import { apiClient } from './client';
import type { DayWiseLogResponse } from '../types';

export const logApi = {
    async getLogs(page: number = 1, limit: number = 5): Promise<DayWiseLogResponse> {
        const tzOffset = new Date().getTimezoneOffset();
        return apiClient<DayWiseLogResponse>('/logs', {
            method: 'GET',
            params: {
                page,
                limit,
                tzOffset,
            },
        });
    },

    async clearLogs(): Promise<{ success: boolean; message: string }> {
        return apiClient<{ success: boolean; message: string }>('/logs', {
            method: 'DELETE',
        });
    },
};
