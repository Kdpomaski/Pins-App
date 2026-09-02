import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Mail, Lock } from 'lucide-react';
import { supabase, getAuthRedirectUrl, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

type AuthMode = 'sign-in' | 'sign-up';

function formatSignInError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'No confirmed Pins account for that email and password. If you just signed up, check inbox and spam for the confirmation link — Sign In will fail until you tap it. If you have not created an account yet, use Sign Up.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email first. Check inbox and spam, then tap the Pins confirmation link.';
  }
  return message;
}

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const resetMessages = () => {
    setError('');
    setInfo('');
    setShowResend(false);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-border rounded-2xl bg-card p-6 space-y-3 text-sm">
          <h1 className="text-lg font-semibold">Supabase not configured</h1>
          <p className="text-muted-foreground">
            Add <code className="text-foreground">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code> in your Vercel project
            environment variables, then <strong>redeploy</strong> (Vite bakes env vars in at build time).
          </p>
        </div>
      </div>
    );
  }

  const signUp = async () => {
    resetMessages();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    if (signUpError) {
      setError(signUpError.message);
      if (signUpError.message.toLowerCase().includes('already registered')) {
        setShowResend(true);
      }
    } else {
      setInfo('Check your email (and spam) — tap the confirmation link. Sign In will say “Invalid login credentials” until that link is opened.');
      setShowResend(true);
    }
    setLoading(false);
  };

  const signIn = async () => {
    resetMessages();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError(formatSignInError(signInError.message));
      setShowResend(true);
    }
    setLoading(false);
  };

  const resendConfirmation = async () => {
    resetMessages();
    if (!email.trim()) {
      setError('Enter your email first, then resend the confirmation link.');
      return;
    }
    setLoading(true);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    if (resendError) setError(resendError.message);
    else setInfo('Confirmation email sent. Check inbox and spam, then tap the link before signing in.');
    setShowResend(true);
    setLoading(false);
  };

  const googleSignIn = async () => {
    resetMessages();
    setLoading(true);
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(),
        skipBrowserRedirect: true,
        scopes: 'email profile',
        queryParams: { prompt: 'select_account' },
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
      return;
    }
    const oauthUrl = data.url;
    if (!oauthUrl) {
      setError('Google sign-in URL was not returned.');
      setLoading(false);
      return;
    }
    let clientId = '';
    try {
      clientId = new URL(oauthUrl).searchParams.get('client_id') ?? '';
    } catch {
      setError('Google sign-in URL was invalid.');
      setLoading(false);
      return;
    }
    if (!clientId.endsWith('.apps.googleusercontent.com')) {
      setError(
        `Google is misconfigured in Supabase. Client ID is currently "${clientId || '(empty)'}" — it must be a Google Cloud Web client ending in .apps.googleusercontent.com. Open Authentication → Providers → Google and replace Pins.App with the real Client ID + Secret.`,
      );
      setLoading(false);
      return;
    }
    window.location.assign(oauthUrl);
  };

  const handleSubmit = () => {
    if (mode === 'sign-in') void signIn();
    else void signUp();
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <img
            src="/icon-192.png"
            alt="Pins"
            className="w-20 h-20 mx-auto rounded-2xl shadow-lg"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Pins</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Beta · Peptide &amp; Injection Protocol Tracker
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-xl border border-border">
            {(['sign-in', 'sign-up'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setMode(tab);
                  resetMessages();
                }}
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
            onClick={() => void googleSignIn()}
          >
            <FcGoogle className="text-lg" />
            Continue with Google
          </Button>
          <p className="text-[11px] text-muted-foreground text-center -mt-2">
            Google is currently broken: Supabase still has Client ID{' '}
            <code className="font-mono">Pins.App</code>. Use email until that is replaced in{' '}
            <a
              className="text-primary underline"
              href="https://supabase.com/dashboard/project/ucijobfqdwkqhdqdffno/auth/providers"
              target="_blank"
              rel="noreferrer"
            >
              Authentication → Providers → Google
            </a>
            .
          </p>

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
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-primary" role="status">
              {info}
            </p>
          )}

          <Button className="w-full" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Please wait…' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
          </Button>
          {showResend && (
            <button
              type="button"
              className="w-full text-xs text-muted-foreground hover:text-primary"
              disabled={loading}
              onClick={() => void resendConfirmation()}
            >
              Resend confirmation email
            </button>
          )}
        </div>
      </div>
    </div>
  );
}