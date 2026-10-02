import { apiClient } from './client';
import type { PushSubscriptionDTO } from '../types';

export const pushApi = {
    async getPublicKey(): Promise<{ success: boolean; publicKey: string }> {
        return apiClient<{ success: boolean; publicKey: string }>('/push/public-key', {
            method: 'GET',
        });
    },

    async subscribe(subscription: PushSubscriptionDTO): Promise<{ success: boolean; message: string }> {
        return apiClient<{ success: boolean; message: string }>('/push/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
        });
    },

    async unsubscribe(endpoint: string): Promise<{ success: boolean; message: string }> {
        return apiClient<{ success: boolean; message: string }>('/push/unsubscribe', {
            method: 'POST',
            body: JSON.stringify({ endpoint }),
        });
    },
};
