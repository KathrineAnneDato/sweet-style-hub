import { useState, useCallback } from 'react';

interface User {
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    // Simulate auth — will be replaced with Lovable Cloud later
    await new Promise(r => setTimeout(r, 800));
    if (email && password.length >= 4) {
      setUser({ email, name: email.split('@')[0] });
    } else {
      setError('Invalid credentials. Please try again.');
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return { user, isLoading, error, login, logout };
}
