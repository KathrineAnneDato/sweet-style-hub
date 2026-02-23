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

  const checkBlocked = useCallback(async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('user_permissions')
      .select('is_blocked')
      .eq('user_id', userId)
      .single();
    return data?.is_blocked ?? false;
  }, []);

  const buildAuthUser = useCallback(async (supaUser: User): Promise<AuthUser | null> => {
    // Check blocked status first
    const blocked = await checkBlocked(supaUser.id);
    if (blocked) {
      await supabase.auth.signOut();
      return null;
    }

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
  }, [checkBlocked]);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          setTimeout(async () => {
            if (!isMounted) return;
            const authUser = await buildAuthUser(session.user);
            if (isMounted) {
              if (!authUser) {
                setUser(null);
                setError('Your account has been blocked. Please contact an administrator.');
              } else {
                setUser(authUser);
              }
            }
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          const authUser = await buildAuthUser(session.user);
          if (isMounted) {
            if (!authUser) {
              setUser(null);
              setError('Your account has been blocked. Please contact an administrator.');
            } else {
              setUser(authUser);
            }
          }
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
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setIsLoading(false);
      return;
    }
    // Check blocked after successful auth
    if (data.user) {
      const blocked = await checkBlocked(data.user.id);
      if (blocked) {
        await supabase.auth.signOut();
        setError('Your account has been blocked. Please contact an administrator.');
        setUser(null);
      }
    }
    setIsLoading(false);
  }, [checkBlocked]);

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
