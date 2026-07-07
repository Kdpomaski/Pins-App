import type { AgeRange, Gender, UserProfile } from '@/lib/auth-types';
import { getSupabase } from '@/lib/supabase';

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, age_range, gender, terms_accepted_at, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}

export function isProfileComplete(profile: UserProfile | null): boolean {
  return Boolean(profile?.age_range && profile?.gender && profile?.terms_accepted_at);
}

export async function upsertProfile(
  userId: string,
  input: { age_range: AgeRange; gender: Gender; terms_accepted_at: string },
): Promise<UserProfile> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        age_range: input.age_range,
        gender: input.gender,
        terms_accepted_at: input.terms_accepted_at,
        updated_at: now,
      },
      { onConflict: 'id' },
    )
    .select('id, age_range, gender, terms_accepted_at, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as UserProfile;
}