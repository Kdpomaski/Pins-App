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
import { getAuthRedirectUrl, isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthStatus = 'loading' | 'unauthenticated' | 'onboarding' | 'authenticated';

type AuthContextValue = {
  status: AuthStatus;
  configured: boolean;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user) {
      setProfile(null);
      setStatus('unauthenticated');
      return;
    }

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
      setStatus(import.meta.env.DEV ? 'authenticated' : 'unauthenticated');
      return;
    }

    let cancelled = false;

    (async () => {
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getAuthRedirectUrl() },
    });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setStatus('unauthenticated');
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);

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
      signOut,
      refreshProfile,
    }),
    [
      status,
      user,
      session,
      profile,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}