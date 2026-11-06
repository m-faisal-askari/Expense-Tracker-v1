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
      // 1. Check Supabase session user if available
      let supabaseUser = null;
      try {
        const { data } = await supabase.auth.getUser();
        supabaseUser = data?.user;
      } catch (e) {}

      // 2. Fetch backend profile & info
      const data = await api.get('/auth/me');
      if (data && data.is_authenticated) {
        const sbName = supabaseUser?.user_metadata?.full_name || supabaseUser?.user_metadata?.name;
        const sbEmail = supabaseUser?.email;

        const resolvedEmail = (data.email && !data.email.includes('@freelancer.local'))
          ? data.email
          : (sbEmail || data.email);

        const resolvedName = (data.full_name && data.full_name !== 'Independent Freelancer' && data.full_name !== 'Freelancer' && data.full_name !== 'Guest Freelancer')
          ? data.full_name
          : (sbName || data.full_name);

        setUser({
          ...data,
          email: resolvedEmail,
          full_name: resolvedName
        });
      } else if (supabaseUser) {
        const sbName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Freelancer';
        setUser({
          user_id: supabaseUser.id,
          is_authenticated: true,
          is_guest: false,
          email: supabaseUser.email,
          full_name: sbName,
          base_currency: 'USD'
        });
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const syncOAuthProfile = async (sessionUser) => {
    if (!sessionUser) return;
    const email = sessionUser.email;
    const fullName = sessionUser.user_metadata?.full_name || 
                     sessionUser.user_metadata?.name || 
                     (email ? email.split('@')[0].replace(/[._]/g, ' ') : 'Freelancer');
    try {
      await api.put('/auth/profile', {
        email: email,
        full_name: fullName
      });
    } catch (err) {
      // Non-blocking sync attempt
    }
  };

  useEffect(() => {
    // 1. Check existing Supabase session or stored token
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setAuthToken(session.access_token);
          if (session.user) {
            await syncOAuthProfile(session.user);
          }
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
        if (session.user) {
          await syncOAuthProfile(session.user);
        }
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.session?.access_token) {
        setAuthToken(data.session.access_token);
        if (data.session.user) {
          await syncOAuthProfile(data.session.user);
        }
        await fetchCurrentUser();
        queryClient.invalidateQueries();
        return data;
      }
    } catch (e) {}

    const res = await api.post('/auth/login', { email, password });
    setAuthToken(res.access_token);
    await fetchCurrentUser();
    queryClient.invalidateQueries();
    return res;
  };

  const register = async (email, password, full_name) => {
    try {
      await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name } }
      });
    } catch (e) {}

    const res = await api.post('/auth/register', { email, password, full_name });
    setAuthToken(res.access_token);
    await fetchCurrentUser();
    queryClient.invalidateQueries();
    return res;
  };

  const loginWithGoogle = async (oauthPayload) => {
    // If a custom OAuth payload is passed (e.g. from modal simulation or dev mode)
    if (oauthPayload?.email) {
      const res = await api.post('/auth/google', oauthPayload);
      if (res?.access_token) {
        setAuthToken(res.access_token);
        await fetchCurrentUser();
        queryClient.invalidateQueries();
        return res;
      }
    }

    // Try Supabase Google OAuth
    try {
      const targetOrigin = (typeof window !== 'undefined' && window.location.origin)
        ? window.location.origin
        : (import.meta.env.VITE_SITE_URL || 'https://expense-tracker-v1-xi.vercel.app');
      const cleanOrigin = targetOrigin.replace(/\/$/, '');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: cleanOrigin
        }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      // Fallback to backend Google OAuth endpoint
      const fallbackPayload = oauthPayload || {
        email: 'google.freelancer@gmail.com',
        full_name: 'Google User',
        sub: `google_${Date.now()}`
      };
      const res = await api.post('/auth/google', fallbackPayload);
      if (res?.access_token) {
        setAuthToken(res.access_token);
        await fetchCurrentUser();
        queryClient.invalidateQueries();
        return res;
      }
      throw err;
    }
  };

  const continueAsGuest = () => {
    localStorage.removeItem('ff_auth_token');
    setUser(null);
    queryClient.invalidateQueries();
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
      continueAsGuest,
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
