import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogOut, Shield, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useSecurity } from '@/lib/security-context';
import { PRIVACY } from '@/lib/privacy';
import { Button } from '@/components/ui/button';

type SecuritySettingsProps = {
  open: boolean;
  onClose: () => void;
};

export function SecurityBadge() {
  const { encryptionMode } = useSecurity();

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-card border border-border rounded-full px-2.5 py-1">
      <Shield size={11} className="text-primary" />
      Local · {encryptionMode === 'passphrase' ? 'Passphrase' : 'Encrypted'}
    </span>
  );
}

export function SecuritySettings({ open, onClose }: SecuritySettingsProps) {
  const { user, signOut } = useAuth();
  const { encryptionMode, enablePassphrase, lock } = useSecurity();
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setPassphrase('');
    setConfirm('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleEnablePassphrase = async () => {
    if (passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters.');
      return;
    }
    if (passphrase !== confirm) {
      setError('Passphrases do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await enablePassphrase(passphrase);
      resetForm();
      onClose();
    } catch {
      setError('Could not enable passphrase protection. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl max-w-md mx-auto shadow-2xl p-6 pb-safe"
          >
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-primary" />
                <h2 className="text-lg font-semibold">Security</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 -mr-2 text-muted-foreground bg-secondary/50 rounded-full"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-2">
                <p className="font-medium">Local-first · Beta account</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>Health data encrypted on this device ({PRIVACY.localFirst ? 'yes' : 'no'})</li>
                  <li>AES-256-GCM encryption at rest</li>
                  <li>Account stores age range &amp; gender only (anonymous stats)</li>
                  <li>E2E cloud backup not enabled yet</li>
                </ul>
                {user?.email && (
                  <p className="text-xs text-muted-foreground pt-1">Signed in as {user.email}</p>
                )}
              </div>

              {encryptionMode === 'device' ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs">
                    Optional: protect data with a passphrase you enter each session. Your existing data
                    will be re-encrypted automatically.
                  </p>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="New passphrase (min 8 chars)"
                    className="w-full border border-border rounded-lg p-3 bg-input/30 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm passphrase"
                    className="w-full border border-border rounded-lg p-3 bg-input/30 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && void handleEnablePassphrase()}
                  />
                  {error && <p className="text-destructive text-xs">{error}</p>}
                  <Button
                    className="w-full"
                    disabled={loading || !passphrase || !confirm}
                    onClick={() => void handleEnablePassphrase()}
                  >
                    Enable passphrase lock
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs">
                    Passphrase protection is on. Lock the app to require your passphrase again.
                  </p>
                  <Button variant="outline" className="w-full" onClick={lock}>
                    Lock now
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => void signOut()}
              >
                <LogOut size={16} />
                Sign out
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}