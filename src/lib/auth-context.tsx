import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/auth-types';
import { fetchProfile, isProfileComplete } from '@/lib/profile';
import {
  clearAuthParamsFromUrl,
  completeAuthFromUrl,
  hasAuthCallbackParams,
} from '@/lib/auth-callback';
import { deleteOwnAccount } from '@/lib/delete-account';
import { readGuestMode, writeGuestMode } from '@/lib/guest-mode';
import { getAuthRedirectUrl, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { ensureNativeAuthDeepLinkListener, startAppleOAuth, startGoogleOAuth } from '@/lib/native-oauth';

type AuthStatus = 'loading' | 'unauthenticated' | 'guest' | 'onboarding' | 'authenticated';

type AuthContextValue = {
  status: AuthStatus;
  configured: boolean;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithApple: () => Promise<{ error?: string }>;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
  deleteAccount: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  nativeAuthError: string | null;
  clearNativeAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function resolveStatus(session: Session | null, profile: UserProfile | null): AuthStatus {
  if (!session) return 'unauthenticated';
  if (!isProfileComplete(profile)) return 'onboarding';
  return 'authenticated';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nativeAuthError, setNativeAuthError] = useState<string | null>(null);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user) {
      setProfile(null);
      setStatus(readGuestMode() ? 'guest' : 'unauthenticated');
      return;
    }

    writeGuestMode(false);

    try {
      const nextProfile = await fetchProfile(nextSession.user.id);
      setProfile(nextProfile);
      setStatus(resolveStatus(nextSession, nextProfile));
    } catch {
      setProfile(null);
      setStatus('onboarding');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      if (readGuestMode()) {
        setStatus('guest');
        return;
      }
      setStatus(import.meta.env.DEV ? 'authenticated' : 'unauthenticated');
      return;
    }

    let cancelled = false;

    (async () => {
      const onCallbackRoute = window.location.pathname.endsWith('/auth/callback');
      if (hasAuthCallbackParams() && !onCallbackRoute) {
        await completeAuthFromUrl();
        clearAuthParamsFromUrl();
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await loadProfile(data.session);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      void loadProfile(nextSession);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    const needsConfirmation = !data.session && !error;
    return { error: error?.message, needsConfirmation };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await startGoogleOAuth();
    return { error };
  }, []);

  const signInWithApple = useCallback(async () => {
    const { error } = await startAppleOAuth();
    return { error };
  }, []);

  const continueAsGuest = useCallback(() => {
    writeGuestMode(true);
    setSession(null);
    setUser(null);
    setProfile(null);
    setStatus('guest');
  }, []);

  const exitGuestMode = useCallback(() => {
    writeGuestMode(false);
    setStatus('unauthenticated');
  }, []);

  const deleteAccount = useCallback(async () => {
    const result = await deleteOwnAccount();
    if (result.error) return result;
    writeGuestMode(false);
    setSession(null);
    setUser(null);
    setProfile(null);
    setStatus('unauthenticated');
    return {};
  }, []);

  const signOut = useCallback(async () => {
    writeGuestMode(false);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setStatus('unauthenticated');
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);


  const clearNativeAuthError = useCallback(() => {
    setNativeAuthError(null);
  }, []);

  useEffect(() => {
    ensureNativeAuthDeepLinkListener((result) => {
      if (result.error) {
        console.warn('[auth] native oauth callback', result.error);
        setNativeAuthError(result.error);
        return;
      }
      setNativeAuthError(null);
      // onAuthStateChange picks up the new session after exchangeCodeForSession
    });
  }, []);

  const value = useMemo(
    () => ({
      status,
      configured: isSupabaseConfigured,
      user,
      session,
      profile,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithApple,
      continueAsGuest,
      exitGuestMode,
      deleteAccount,
      signOut,
      refreshProfile,
      nativeAuthError,
      clearNativeAuthError,
    }),
    [
      status,
      user,
      session,
      profile,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signInWithApple,
      continueAsGuest,
      exitGuestMode,
      deleteAccount,
      signOut,
      refreshProfile,
      nativeAuthError,
      clearNativeAuthError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}