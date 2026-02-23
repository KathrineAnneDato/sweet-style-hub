import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildAuthUser = useCallback(async (supaUser: User): Promise<AuthUser | null> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', supaUser.id)
      .single();

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', supaUser.id)
      .single();

    return {
      id: supaUser.id,
      email: supaUser.email ?? '',
      name: profile?.full_name || supaUser.user_metadata?.full_name || supaUser.email?.split('@')[0] || '',
      role: (roleRow?.role as 'admin' | 'user') ?? 'user',
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes — does NOT control isLoading
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          // Use setTimeout to avoid deadlock with Supabase internals
          setTimeout(async () => {
            if (!isMounted) return;
            const authUser = await buildAuthUser(session.user);
            if (isMounted) setUser(authUser);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // INITIAL load — controls isLoading
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          const authUser = await buildAuthUser(session.user);
          if (isMounted) setUser(authUser);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [buildAuthUser]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
    }
    setIsLoading(false);
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (err) {
      setError(err.message);
    } else {
      setError(null);
    }
    setIsLoading(false);
    return !err;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, isLoading, error, login, signup, logout, setError };
}
