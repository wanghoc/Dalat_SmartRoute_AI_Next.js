'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';

// =============================================================================
// Auth Context
// =============================================================================

const AuthContext = createContext(null);

// =============================================================================
// Auth Provider Component
// =============================================================================

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        let cancelled = false;

        const bootstrapAuth = async () => {
            const storedUser = localStorage.getItem('dalat_user');
            const storedToken = localStorage.getItem('dalat_token');

            if (!storedToken) {
                if (!cancelled) {
                    setIsLoading(false);
                }
                return;
            }

            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    localStorage.removeItem('dalat_user');
                }
            }

            setToken(storedToken);

            try {
                const response = await fetch(`${API_BASE}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${storedToken}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Session expired');
                }

                const freshUser = await response.json();
                if (cancelled) return;

                setUser(freshUser);
                localStorage.setItem('dalat_user', JSON.stringify(freshUser));
                localStorage.setItem('dalat_token', storedToken);
            } catch {
                if (cancelled) return;
                setUser(null);
                setToken(null);
                localStorage.removeItem('dalat_user');
                localStorage.removeItem('dalat_token');
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        bootstrapAuth();

        return () => {
            cancelled = true;
        };
    }, []);

    // Register function - creates new account
    const register = async (email, username, password) => {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('dalat_user', JSON.stringify(data.user));
        localStorage.setItem('dalat_token', data.token);
        return data.user;
    };

    // Login function - validates credentials
    const login = async (email, password) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('dalat_user', JSON.stringify(data.user));
        localStorage.setItem('dalat_token', data.token);
        return data.user;
    };

    // Logout function
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('dalat_user');
        localStorage.removeItem('dalat_token');
    };

    const updateUser = (patch) => {
        if (!patch) return;
        setUser((prev) => {
            if (!prev) return prev;
            const next = { ...prev, ...patch };
            localStorage.setItem('dalat_user', JSON.stringify(next));
            return next;
        });
    };

    const value = {
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// =============================================================================
// Custom Hook
// =============================================================================

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
