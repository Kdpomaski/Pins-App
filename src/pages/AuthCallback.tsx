import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    const finish = () => setLocation('/');

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        finish();
      }
    });

    (async () => {
      try {
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const { data } = await supabase.auth.getSession();
        if (data.session) finish();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed.');
      }
    })();

    return () => listener.subscription.unsubscribe();
  }, [setLocation]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground text-sm px-4">
      {error ? <p className="text-destructive">{error}</p> : 'Signing you in…'}
    </div>
  );
}