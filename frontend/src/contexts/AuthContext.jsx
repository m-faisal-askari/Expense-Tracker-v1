import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../api/client';
import { supabase } from '../api/supabase';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/auth/me');
      if (data && data.is_authenticated) {
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check existing Supabase session or stored token
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setAuthToken(session.access_token);
        }
      } catch (err) {
        console.warn('Supabase session check error:', err);
      }
      await fetchCurrentUser();
    };

    initAuth();

    // 2. Listen to Supabase auth state changes (e.g. Google OAuth redirect callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token) {
        setAuthToken(session.access_token);
        await fetchCurrentUser();
        queryClient.invalidateQueries();
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('ff_auth_token');
        setUser(null);
        queryClient.clear();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    // First try Supabase Auth signInWithPassword
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.session?.access_token) {
        setAuthToken(data.session.access_token);
        await fetchCurrentUser();
        queryClient.invalidateQueries();
        return data;
      }
    } catch (e) {
      // Fallback to backend authentication
    }

    const res = await api.post('/auth/login', { email, password });
    setAuthToken(res.access_token);
    await fetchCurrentUser();
    queryClient.invalidateQueries();
    return res;
  };

  const register = async (email, password, full_name) => {
    // Register in Supabase Auth if available
    try {
      await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name } }
      });
    } catch (e) {
      // Continue to backend registration
    }

    const res = await api.post('/auth/register', { email, password, full_name });
    setAuthToken(res.access_token);
    await fetchCurrentUser();
    queryClient.invalidateQueries();
    return res;
  };

  const loginWithGoogle = async () => {
    // Resolve redirect URL cleanly (browser origin or configured production site)
    const targetOrigin = (typeof window !== 'undefined' && window.location.origin)
      ? window.location.origin
      : (import.meta.env.VITE_SITE_URL || 'https://expense-tracker-v1-xi.vercel.app');
    const cleanOrigin = targetOrigin.replace(/\/$/, '');

    // Official Supabase Google OAuth provider redirect
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: cleanOrigin
      }
    });

    if (error) {
      throw new Error(error.message || 'Supabase Google OAuth initiation failed. Please check Google provider settings in Supabase dashboard.');
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('ff_auth_token');
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      loginWithGoogle,
      logout,
      refreshUser: fetchCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
