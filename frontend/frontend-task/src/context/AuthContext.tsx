import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginInput, CreateAccountInput } from '../types';
import { authApi } from '../api/auth.api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: LoginInput) => Promise<void>;
    signup: (credentials: CreateAccountInput) => Promise<string>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const refreshUser = async () => {
        try {
            const res = await authApi.getMe();
            if (res.success && res.user) {
                setUser(res.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = async (credentials: LoginInput) => {
        const res = await authApi.login(credentials);
        if (res.user) {
            setUser(res.user);
        } else {
            await refreshUser();
        }
    };

    const signup = async (credentials: CreateAccountInput): Promise<string> => {
        const res = await authApi.createAccount(credentials);
        return res.message;
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
