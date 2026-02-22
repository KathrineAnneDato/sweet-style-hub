import { Sparkles } from 'lucide-react';
import Login from './Login';
import Dashboard from './Dashboard';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, isLoading, error, login, signup, logout, setError } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Sparkles className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={login} onSignup={signup} isLoading={isLoading} error={error} />;
  }

  return <Dashboard user={user} onLogout={logout} />;
};

export default Index;
