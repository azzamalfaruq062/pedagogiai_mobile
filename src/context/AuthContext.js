import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { CONFIG } from '../config';
import { appStorage } from '../utils/storage';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore authenticated session on app boot
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await appStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        const savedUserStr = await appStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);

        if (savedUserStr) {
          try {
            setUser(JSON.parse(savedUserStr));
          } catch (e) {}
        }

        if (savedToken) {
          // Verify token against Laravel Sanctum /api/auth/me
          const res = await authApi.getProfile(savedToken);
          if (res?.data?.user) {
            setUser(res.data.user);
            await appStorage.setItem(
              CONFIG.STORAGE_KEYS.USER_DATA,
              JSON.stringify(res.data.user)
            );
          }
        }
      } catch (err) {
        // If 401 Unauthenticated, token has expired or revoked on server
        if (err?.message === 'Unauthenticated.' || err?.status === 401) {
          console.warn('[AuthContext] Sesi kedaluwarsa, membersihkan token lama.');
          await appStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
          await appStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
          setUser(null);
        } else {
          console.warn('[AuthContext] Session restore check (offline/network):', err?.message || err);
        }
      }
    };

    restoreSession();
  }, []);

  const login = async ({ email, password, rememberMe }) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });

      if (res.success && res.data?.token) {
        const token = res.data.token;
        const userData = res.data.user;

        // Persist token and user in storage
        await appStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
        await appStorage.setItem(
          CONFIG.STORAGE_KEYS.USER_DATA,
          JSON.stringify(userData)
        );

        setUser(userData);
        return { success: true, user: userData, message: res.message };
      }

      return {
        success: false,
        message: res.message || 'Login gagal. Periksa kembali email dan password Anda.',
      };
    } catch (error) {
      console.warn('[AuthContext] Login error:', error);
      return {
        success: false,
        message:
          error?.message ||
          'Terjadi kesalahan saat menghubungi server. Pastikan server Laravel aktif.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ name, email, role, password, nrs }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register({ name, email, role, password, nrs });

      if (res.success && res.data?.token) {
        const token = res.data.token;
        const userData = res.data.user;

        await appStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
        await appStorage.setItem(
          CONFIG.STORAGE_KEYS.USER_DATA,
          JSON.stringify(userData)
        );

        setUser(userData);
        return { success: true, user: userData, message: res.message };
      }

      return {
        success: false,
        message: res.message || 'Registrasi gagal.',
      };
    } catch (error) {
      return {
        success: false,
        message:
          error?.message ||
          'Terjadi kesalahan saat registrasi. Pastikan data terisi dengan benar.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = await appStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        await authApi.logout(token).catch(() => {});
      }
    } catch (e) {
    } finally {
      await appStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      await appStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
