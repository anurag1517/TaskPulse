import { apiClient } from './client';
import type { CreateTaskDTO, Task, TaskFilterOptions, UpdateTaskDTO } from '../types';

export const taskApi = {
    async getTasks(filters?: TaskFilterOptions): Promise<{ success: boolean; count: number; data: Task[] }> {
        const tzOffset = filters?.tzOffset ?? new Date().getTimezoneOffset();
        return apiClient<{ success: boolean; count: number; data: Task[] }>('/task', {
            method: 'GET',
            params: {
                done: filters?.done,
                pri: filters?.pri,
                search: filters?.search,
                date: filters?.date,
                tzOffset,
            },
        });
    },

    async getTaskById(id: number): Promise<{ success: boolean; data: Task }> {
        return apiClient<{ success: boolean; data: Task }>(`/task/${id}`, {
            method: 'GET',
        });
    },

    async createTask(data: CreateTaskDTO): Promise<{ success: boolean; data: Task; message: string }> {
        return apiClient<{ success: boolean; data: Task; message: string }>('/task', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateTask(id: number, data: UpdateTaskDTO): Promise<{ success: boolean; data: Task; message: string }> {
        return apiClient<{ success: boolean; data: Task; message: string }>(`/task/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async toggleTask(id: number, done?: boolean): Promise<{ success: boolean; data: Task; message: string }> {
        return apiClient<{ success: boolean; data: Task; message: string }>(`/task/${id}/toggle`, {
            method: 'PATCH',
            body: JSON.stringify(done !== undefined ? { done } : {}),
        });
    },

    async deleteTask(id: number): Promise<{ success: boolean; message: string }> {
        return apiClient<{ success: boolean; message: string }>(`/task/${id}`, {
            method: 'DELETE',
        });
    },
};
