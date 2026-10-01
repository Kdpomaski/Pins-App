import { createContext, useContext, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, Settings, Shield, Trash2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { DELETE_ACCOUNT_CONFIRMATION, isPermanentDeleteConfirmed } from '@/lib/delete-account';
import { useSecurity } from '@/lib/security-context';
import { PRIVACY } from '@/lib/privacy';
import { Button } from '@/components/ui/button';
import {
  getShotDueNotificationsEnabled,
  setShotDueNotificationsEnabled,
} from '@/lib/notification-prefs';
import {
  cancelAllShotNotifications,
  requestShotNotificationPermission,
  rescheduleShotDueNotifications,
} from '@/lib/shot-notifications';
import { usePinsStore } from '@/lib/store';


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
  const { user, status, signOut, deleteAccount, exitGuestMode } = useAuth();
  const { encryptionMode, enablePassphrase, lock } = useSecurity();
  const { data } = usePinsStore();
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shotDueOn, setShotDueOn] = useState(getShotDueNotificationsEnabled);
  const [notifMsg, setNotifMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleShotDueToggle = async (next: boolean) => {
    setNotifMsg('');
    if (next) {
      const granted = await requestShotNotificationPermission();
      if (!granted) {
        setShotDueOn(false);
        setShotDueNotificationsEnabled(false);
        setNotifMsg('Notification permission is required to enable shot reminders.');
        return;
      }
      setShotDueOn(true);
      setShotDueNotificationsEnabled(true);
      await rescheduleShotDueNotifications({ schedule: data.schedule, logs: data.logs, enabled: true });
      return;
    }
    setShotDueOn(false);
    setShotDueNotificationsEnabled(false);
    await cancelAllShotNotifications();
  };

  const resetForm = () => {
    setPassphrase('');
    setConfirm('');
    setError('');
    setConfirmDelete(false);
    setDeleteText('');
    setDeleteError('');
  };

  const handleClose = () => {
    if (deleting) return;
    resetForm();
    onClose();
  };

  const handleDeleteAccount = async () => {
    if (!isPermanentDeleteConfirmed(deleteText)) return;
    setDeleting(true);
    setDeleteError('');
    const result = await deleteAccount();
    if (result.error) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl max-w-md mx-auto shadow-2xl p-6 pb-safe max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-primary" />
                <h2 className="text-lg font-semibold">Settings</h2>
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
              </div>

              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                <p className="font-medium">Account</p>
                {user ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Signed in as {user.email ?? 'your Pins account'}
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => void signOut()}>
                      <LogOut size={16} />
                      Sign out
                    </Button>
                    {confirmDelete ? (
                      <div className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
                        <p className="text-sm font-medium text-destructive">Delete account permanently?</p>
                        <p className="text-xs text-muted-foreground">
                          This permanently deletes your Pins account. It is not a deactivation and cannot be undone.
                          We remove the sign-in (Apple, Google, or email) and the profile stored with it (age range
                          and gender). Injection logs, inventory, and schedule are stored only on this device and
                          stay on this device.
                        </p>
                        <label className="block text-xs text-muted-foreground" htmlFor="delete-account-confirm">
                          Type {DELETE_ACCOUNT_CONFIRMATION} to confirm
                        </label>
                        <input
                          id="delete-account-confirm"
                          value={deleteText}
                          onChange={(e) => setDeleteText(e.target.value)}
                          autoComplete="off"
                          autoCapitalize="characters"
                          placeholder={DELETE_ACCOUNT_CONFIRMATION}
                          className="w-full border border-border rounded-lg p-3 bg-input/30 text-foreground focus:ring-1 focus:ring-destructive focus:outline-none"
                        />
                        {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
                        <Button
                          variant="destructive"
                          className="w-full"
                          disabled={deleting || !isPermanentDeleteConfirmed(deleteText)}
                          onClick={() => void handleDeleteAccount()}
                        >
                          <Trash2 size={16} />
                          {deleting ? 'Deleting account…' : 'Permanently delete account'}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={deleting}
                          onClick={() => {
                            setConfirmDelete(false);
                            setDeleteText('');
                            setDeleteError('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full text-destructive"
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Trash2 size={16} />
                        Delete account
                      </Button>
                    )}
                  </>
                ) : status === 'guest' ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      No account. Map, schedule, inventory, and calculator stay on this device.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        exitGuestMode();
                        onClose();
                      }}
                    >
                      Sign in or create an account
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => void signOut()}>
                    <LogOut size={16} />
                    Sign out
                  </Button>
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

              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-primary" />
                    <p className="font-medium">Shot-due reminders</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={shotDueOn}
                    onClick={() => void handleShotDueToggle(!shotDueOn)}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
                      shotDueOn ? 'bg-primary border-primary' : 'bg-muted border-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition ${
                        shotDueOn ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Local alert when a calendar shot is due — “time to take the pin” with compound and dose.
                </p>
                {notifMsg && <p className="text-xs text-destructive">{notifMsg}</p>}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const OpenSettingsContext = createContext<(() => void) | null>(null);

/** Settings sheet for the signed-in app. Mount once inside PinsProvider. */
export function SettingsSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <OpenSettingsContext.Provider value={() => setOpen(true)}>
      {children}
      <SecuritySettings open={open} onClose={() => setOpen(false)} />
    </OpenSettingsContext.Provider>
  );
}

export function useOpenSettings(): () => void {
  const openSettings = useContext(OpenSettingsContext);
  if (!openSettings) throw new Error('useOpenSettings must be used within SettingsSheetProvider');
  return openSettings;
}