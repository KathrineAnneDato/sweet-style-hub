import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onSignup: (email: string, password: string, fullName: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

const Login = ({ onLogin, onSignup, isLoading, error }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup) {
      const ok = await onSignup(email, password, fullName);
      if (ok) setSignupSuccess(true);
    } else {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-accent/30 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md px-4 relative z-10"
      >
        <Card className="border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80">
          <CardHeader className="text-center space-y-4 pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
            >
              <ShoppingBag className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Product Manager</h1>
              <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4 text-primary" />
                Manage your inventory with style
                <Heart className="w-4 h-4 text-primary" />
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {signupSuccess ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-foreground font-medium">Check your email to confirm your account!</p>
                <Button variant="outline" onClick={() => { setIsSignup(false); setSignupSuccess(false); }} className="rounded-xl">
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-foreground/80">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="rounded-xl bg-background/60 border-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/80">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="rounded-xl bg-background/60 border-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground/80">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-xl bg-background/60 border-primary/20 focus:border-primary placeholder:text-muted-foreground/50"
                  />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive font-medium">
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl h-11 font-semibold text-base shadow-lg shadow-primary/20"
                >
                  {isLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  ) : isSignup ? 'Create Account' : 'Sign In'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button type="button" onClick={() => setIsSignup(!isSignup)} className="text-primary font-medium hover:underline">
                    {isSignup ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
