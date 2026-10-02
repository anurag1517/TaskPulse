const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5011/api').trim().replace(/\/+$/, '');
const normalizedApiUrl = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

export const config = {
    apiUrl: normalizedApiUrl,
} as const;
