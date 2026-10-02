export interface User {
    id: number;
    email: string;
    name?: string | null;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface CreateAccountInput {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    user?: User;
    token?: string;
    error?: string;
}
