
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken, setUnauthorizedCallback } from '../services/api';

// --- Types ---
type User = {
    token: string;
    // Diğer kullanıcı bilgileri buraya eklenebilir (örn: id, email, nickname)
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
};

// --- Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Uygulama açılışında token kontrolü
    useEffect(() => {
        checkToken();

        // Setup API interceptor for 401 Unauthorized responses
        setUnauthorizedCallback(() => {
            console.warn('Unauthorized error from API interceptor. Logging out.');
            logout();
        });
    }, []);

    const checkToken = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    const currentTime = Date.now() / 1000;
                    if (decoded.exp && decoded.exp < currentTime) {
                        console.log('Token is expired. Logging out.');
                        await AsyncStorage.removeItem('auth_token');
                        setAuthToken(null);
                        setUser(null);
                    } else {
                        // Token is valid
                        setAuthToken(token);
                        setUser({ token });
                    }
                } catch (decodeError) {
                    console.error('Invalid token format:', decodeError);
                    await AsyncStorage.removeItem('auth_token');
                    setAuthToken(null);
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('Token okuma hatası:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (token: string) => {
        try {
            await AsyncStorage.setItem('auth_token', token);
            setAuthToken(token);
            setUser({ token });
            // Yönlendirme işlemi _layout.tsx içinde auth state dinlenerek yapılacak
        } catch (error) {
            console.error('Login işlemi sırasında hata:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('auth_token');
            setAuthToken(null);
            setUser(null);
        } catch (error) {
            console.error('Logout hatası:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Hook ---
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
