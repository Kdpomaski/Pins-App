import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TermsContent } from '@/components/TermsContent';
import { useAuth } from '@/lib/auth-context';

type AuthMode = 'sign-in' | 'sign-up';

export default function Auth() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const resetMessages = () => {
    setError('');
    setInfo('');
  };

  const handleEmailAuth = async () => {
    resetMessages();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'sign-up' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    if (mode === 'sign-in') {
      const result = await signInWithEmail(email.trim(), password);
      if (result.error) setError(result.error);
    } else {
      const result = await signUpWithEmail(email.trim(), password);
      if (result.error) {
        setError(result.error);
      } else if (result.needsConfirmation) {
        setInfo('Check your email to confirm your account, then sign in.');
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    resetMessages();
    setLoading(true);
    const result = await signInWithGoogle();
    if (result.error) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <img src="/icon-192.png" alt="Pins" className="w-20 h-20 mx-auto rounded-2xl" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Pins</h1>
            <p className="text-sm text-muted-foreground mt-1">Beta · Peptide &amp; Injection Protocol Tracker</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-xl border border-border">
            {(['sign-in', 'sign-up'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setMode(tab); resetMessages(); }}
                className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                  mode === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {tab === 'sign-in' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={() => void handleGoogle()}
          >
            <FcGoogle className="text-lg" />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>or email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full pl-10 pr-3 py-3 bg-input/50 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-3 py-3 bg-input/50 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && void handleEmailAuth()}
              />
            </div>
            {mode === 'sign-up' && (
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-3 py-3 bg-input/50 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && void handleEmailAuth()}
                />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          {info && <p className="text-sm text-primary" role="status">{info}</p>}

          <Button className="w-full" disabled={loading} onClick={() => void handleEmailAuth()}>
            {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By continuing you agree to our{' '}
            <button type="button" className="text-primary underline" onClick={() => setShowTerms(true)}>
              Terms &amp; Conditions
            </button>
            .
          </p>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6 shadow-xl">
            <TermsContent />
            <Button className="w-full mt-6" onClick={() => setShowTerms(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}