import { apiClient } from './client';
import type { DayWiseBacklogResponse } from '../types';

export const backlogApi = {
    async getBacklog(
        page: number = 1,
        limit: number = 3,
        date?: string,
        scope: 'all' | 'overdue' | 'upcoming' = 'all'
    ): Promise<DayWiseBacklogResponse> {
        const tzOffset = new Date().getTimezoneOffset();
        return apiClient<DayWiseBacklogResponse>('/backlog', {
            method: 'GET',
            params: {
                page,
                limit,
                tzOffset,
                date: date || undefined,
                scope: scope !== 'all' ? scope : undefined,
            },
        });
    },

    async moveToToday(taskId: number): Promise<{ success: boolean; message: string }> {
        const tzOffset = new Date().getTimezoneOffset();
        return apiClient<{ success: boolean; message: string }>(`/backlog/${taskId}/move-to-today?tzOffset=${tzOffset}`, {
            method: 'POST',
        });
    },
};
