import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearAuthParamsFromUrl, completeAuthFromUrl } from '@/lib/auth-callback';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Confirming your email…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await completeAuthFromUrl();
      if (cancelled) return;

      if (result.error) {
        setError(result.error);
        return;
      }

      setStatus('Success! Opening Pins…');
      clearAuthParamsFromUrl();
      setLocation('/');
    })();

    return () => {
      cancelled = true;
    };
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full border border-border rounded-2xl bg-card p-6 space-y-4 text-center">
          <h1 className="text-lg font-semibold text-foreground">Sign-in link problem</h1>
          <p className="text-sm text-destructive">{error}</p>
          <Button className="w-full" onClick={() => setLocation('/')}>
            Go to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-foreground px-4 gap-3">
      <Loader2 className="animate-spin text-primary" size={28} />
      <p className="text-base font-medium">{status}</p>
    </div>
  );
}