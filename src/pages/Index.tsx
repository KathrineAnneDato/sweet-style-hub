import Login from './Login';
import Dashboard from './Dashboard';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, isLoading, error, login, logout } = useAuth();

  if (!user) {
    return <Login onLogin={login} isLoading={isLoading} error={error} />;
  }

  return <Dashboard userName={user.name} onLogout={logout} />;
};

export default Index;
