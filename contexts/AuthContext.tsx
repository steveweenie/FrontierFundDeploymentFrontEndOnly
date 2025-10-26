import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  userId: string | null;
  username: string | null;
  login: (token: string, userId: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Check for stored auth on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      const storedUserId = await SecureStore.getItemAsync('userId');
      const storedUsername = await SecureStore.getItemAsync('username');
      
      if (storedToken && storedUserId) {
        setToken(storedToken);
        setUserId(storedUserId);
        setUsername(storedUsername);
        setIsAuthenticated(true);
        console.log('✅ Found stored auth, user is logged in');
      } else {
        console.log('ℹ️ No stored auth found');
      }
    } catch (error) {
      console.error('❌ Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUserId: string, newUsername: string) => {
    try {
      await SecureStore.setItemAsync('authToken', newToken);
      await SecureStore.setItemAsync('userId', newUserId);
      await SecureStore.setItemAsync('username', newUsername);
      
      setToken(newToken);
      setUserId(newUserId);
      setUsername(newUsername);
      setIsAuthenticated(true);
      console.log('✅ User logged in and credentials stored');
    } catch (error) {
      console.error('❌ Error storing auth:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userId');
      await SecureStore.deleteItemAsync('username');
      
      setToken(null);
      setUserId(null);
      setUsername(null);
      setIsAuthenticated(false);
      console.log('✅ User logged out');
    } catch (error) {
      console.error('❌ Error clearing auth:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        userId,
        username,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
