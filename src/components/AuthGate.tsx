import { Shield } from 'lucide-react';
import Auth from '@/pages/Auth';
import Onboarding from '@/pages/Onboarding';
import { useAuth } from '@/lib/auth-context';

function SupabaseSetupNotice() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="max-w-md border border-border rounded-2xl bg-card p-6 space-y-3 text-sm">
        <h1 className="text-lg font-semibold">Supabase not configured</h1>
        <p className="text-muted-foreground">
          Copy <code className="text-foreground">.env.example</code> to <code className="text-foreground">.env</code> and
          set your Supabase project URL and anon key to enable beta authentication.
        </p>
        <p className="text-muted-foreground">
          Run <code className="text-foreground">supabase/schema.sql</code> in the Supabase SQL editor, then enable
          Email and Google providers in Authentication → Providers.
        </p>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, configured } = useAuth();

  if (!configured) return <SupabaseSetupNotice />;

  if (status === 'loading') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">
        <Shield className="animate-pulse mr-2" size={20} />
        Checking session…
      </div>
    );
  }

  if (status === 'unauthenticated') return <Auth />;
  if (status === 'onboarding') return <Onboarding />;

  return <>{children}</>;
}