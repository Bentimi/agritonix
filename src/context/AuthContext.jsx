import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = useCallback(async (id) => {
        try {
            const response = await api.get(`/user/${id}`);
            if (response.data.status === 'success') {
                setUser(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setUser(null);
            localStorage.removeItem('userId');
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/user/logout');
        } catch (error) {
            console.error('Logout failed on server:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('userId');
        }
    }, []);

    useEffect(() => {
        // Use localStorage to persist identity through reloads
        const savedId = localStorage.getItem('userId');
        if (savedId) {
            fetchUserProfile(savedId);
        } else {
            setLoading(false);
        }

        // Listen for unauthorized events from API interceptor
        const handleUnauthorized = () => {
            console.warn('Session expired or unauthorized. Logging out...');
            logout();
        };

        window.addEventListener('auth-unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
    }, [fetchUserProfile, logout]);

    const login = async (credentials) => {
        try {
            const response = await api.post('/user/login', credentials);
            if (response.data.status === 'success') {
                const userData = response.data.data.user || response.data.data;
                setUser(userData);
                // Save ID to localStorage for reload persistence
                localStorage.setItem('userId', userData.id);
                return { success: true };
            }
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed' 
            };
        }
    };

    const signup = async (userData) => {
        try {
            const response = await api.post('/user/create-user', userData);
            if (response.data.status === 'success') {
                return { success: true };
            }
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Signup failed' 
            };
        }
    };

    const updateUserProfile = async (id, userData) => {
        try {
            const response = await api.put(`/user/${id}`, userData);
            if (response.data.status === 'success') {
                const updated = response.data.data;
                if (id === user?.id) {
                    setUser(updated);
                }
                return { success: true, user: updated };
            }
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Update failed' 
            };
        }
    };



    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        updateUserProfile,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
