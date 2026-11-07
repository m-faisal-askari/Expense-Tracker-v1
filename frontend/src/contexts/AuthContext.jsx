import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { supabase } from '../api/supabase';
import { FRONTEND_URL } from '../config/urls';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    if (!sessionData?.session?.access_token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const data = await api.get('/auth/me');
      if (!data?.is_authenticated || data.is_guest) {
        throw new Error('The server did not accept this sign-in session.');
      }
      setUser(data);
      return data;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const syncOAuthProfile = async (sessionUser) => {
    if (!sessionUser) return;
    const fullName = sessionUser.user_metadata?.full_name ||
      sessionUser.user_metadata?.name ||
      sessionUser.email?.split('@')[0]?.replace(/[._]/g, ' ') ||
      'Freelancer';

    await api.put('/auth/profile', { full_name: fullName });
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data?.session?.user) {
          await syncOAuthProfile(data.session.user);
        }
        await fetchCurrentUser();
      } catch (error) {
        setUser(null);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token) {
        try {
          await syncOAuthProfile(session.user);
          await fetchCurrentUser();
          queryClient.invalidateQueries();
        } catch (error) {
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        queryClient.clear();
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (error) throw error;
    if (!data?.session?.access_token) {
      throw new Error('Sign-in did not return an active session.');
    }

    await syncOAuthProfile(data.session.user);
    await fetchCurrentUser();
    queryClient.invalidateQueries();
    return data;
  };

  const register = async (email, password, full_name) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name } }
    });
    if (error) throw error;

    // Supabase intentionally returns an obfuscated user with no identities when
    // an email already belongs to an account. Never fall back to local signup.
    if (Array.isArray(data?.user?.identities) && data.user.identities.length === 0) {
      throw new Error('This email may already have an account. Sign in using its existing method.');
    }

    if (data?.session?.access_token) {
      await syncOAuthProfile(data.user);
      await fetchCurrentUser();
      queryClient.invalidateQueries();
      return { ...data, confirmation_required: false };
    }

    return { ...data, confirmation_required: true };
  };

  const loginWithGoogle = async () => {
    const targetOrigin = typeof window !== 'undefined'
      ? window.location.origin
      : FRONTEND_URL;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: targetOrigin ? targetOrigin.replace(/\/$/, '') : undefined }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
