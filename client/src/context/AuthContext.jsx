import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext.js';
import { setUnauthorizedHandler } from '../services/api.js';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser
} from '../services/authService.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const data = await getCurrentUser();
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      async login(credentials) {
        const data = await loginUser(credentials);
        setUser(data.user);
        return data.user;
      },
      async register(payload) {
        const data = await registerUser(payload);
        setUser(data.user);
        return data.user;
      },
      async logout() {
        try {
          await logoutUser();
        } finally {
          setUser(null);
        }
      },
      setUser
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
