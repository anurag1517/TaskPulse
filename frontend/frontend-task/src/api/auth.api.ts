import { apiClient } from './client';
import type { AuthResponse, CreateAccountInput, LoginInput, User } from '../types';

export const authApi = {
    async createAccount(data: CreateAccountInput): Promise<{ message: string }> {
        return apiClient<{ message: string }>('/auth/createAccount', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async login(data: LoginInput): Promise<AuthResponse> {
        return apiClient<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getMe(): Promise<{ success: boolean; user: User }> {
        return apiClient<{ success: boolean; user: User }>('/auth/me', {
            method: 'GET',
        });
    },

    async logout(): Promise<{ success: boolean; message: string }> {
        return apiClient<{ success: boolean; message: string }>('/auth/logout', {
            method: 'POST',
        });
    },
};
