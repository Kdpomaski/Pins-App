import { useState } from 'react';
import { Lock, Shield } from 'lucide-react';
import { useSecurity } from '@/lib/security-context';
import { Button } from '@/components/ui/button';

function UnlockScreen() {
  const { unlock } = useSecurity();
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    setError('');
    const ok = await unlock(passphrase);
    if (!ok) setError('Incorrect passphrase.');
    setLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm border border-border rounded-2xl p-6 bg-card shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={20} className="text-primary" />
          <h1 className="text-lg font-semibold">Unlock Pins</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your data is encrypted on this device. Enter your passphrase to continue.
        </p>
        <input
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Passphrase"
          className="w-full border border-border rounded-lg p-3 bg-input/30 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && void handleUnlock()}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" disabled={loading || !passphrase} onClick={() => void handleUnlock()}>
          Unlock
        </Button>
      </div>
    </div>
  );
}

export function SecurityGate({ children }: { children: React.ReactNode }) {
  const { status, encryptionMode } = useSecurity();

  if (status === 'loading') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background text-muted-foreground">
        <Shield className="animate-pulse mr-2" size={20} />
        Securing local data…
      </div>
    );
  }

  if (status === 'unlock' && encryptionMode === 'passphrase') {
    return <UnlockScreen />;
  }

  return <>{children}</>;
}