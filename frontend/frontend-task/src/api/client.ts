import { config } from '../config/env';

interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

export async function apiClient<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { params, headers, ...customConfig } = options;

    let url = `${config.apiUrl}${endpoint}`;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
    }

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
        ...customConfig,
        headers: {
            ...defaultHeaders,
            ...headers,
        },
        credentials: 'include', // Ensure cookies are always sent/received
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
        throw new ApiError(response.status, errorMessage);
    }

    return data as T;
}
