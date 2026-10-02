import { apiClient } from './client';
import type { TaskLog } from '../types';

export const logApi = {
    async getLogs(limit: number = 100): Promise<{ success: boolean; count: number; data: TaskLog[] }> {
        return apiClient<{ success: boolean; count: number; data: TaskLog[] }>('/logs', {
            method: 'GET',
            params: { limit },
        });
    },

    async clearLogs(): Promise<{ success: boolean; message: string }> {
        return apiClient<{ success: boolean; message: string }>('/logs', {
            method: 'DELETE',
        });
    },
};
