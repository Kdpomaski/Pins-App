import { Shield } from 'lucide-react';
import Auth from '@/pages/Auth';
import Onboarding from '@/pages/Onboarding';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

function SupabaseSetupNotice({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="max-w-md border border-border rounded-2xl bg-card p-6 space-y-3 text-sm">
        <h1 className="text-lg font-semibold">Sign-in unavailable</h1>
        <p className="text-muted-foreground">
          This build was shipped without authentication configuration. You can still use the local tracker
          without an account, or update to the latest TestFlight build.
        </p>
        <Button className="w-full" onClick={onContinue}>
          Continue without an account
        </Button>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, configured, continueAsGuest } = useAuth();
  const devPreview = import.meta.env.DEV && !configured;

  if (status === 'loading') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">
        <Shield className="animate-pulse mr-2" size={20} />
        Checking session…
      </div>
    );
  }

  if (!configured && !devPreview && status !== 'guest') {
    return <SupabaseSetupNotice onContinue={continueAsGuest} />;
  }

  if (!devPreview && status === 'unauthenticated') return <Auth />;
  if (!devPreview && status === 'onboarding') return <Onboarding />;

  return (
    <>
      {devPreview && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs text-center py-2 px-4">
          Dev preview — Supabase auth skipped. Add <code className="font-mono">.env</code> for beta login.
        </div>
      )}
      {children}
    </>
  );
}
