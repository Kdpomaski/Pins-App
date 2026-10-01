import { supabase } from '@/lib/supabase';
export {
  DELETE_ACCOUNT_CONFIRMATION,
  isPermanentDeleteConfirmed,
} from './delete-confirm.mjs';

/** Must match public.delete_own_account in supabase/schema.sql. */
export const DELETE_OWN_ACCOUNT_RPC = 'delete_own_account';

/**
 * Permanently delete the signed-in auth user.
 * Calls the security-definer RPC (no service-role key in the client).
 * Profiles and entitlements cascade from auth.users. This is not a deactivation.
 */
export async function deleteOwnAccount(): Promise<{ error?: string }> {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { error: sessionError.message };
  if (!data.session) return { error: 'Sign in before deleting an account.' };

  const { error } = await supabase.rpc(DELETE_OWN_ACCOUNT_RPC);
  if (error) return { error: error.message };

  // The auth user is already gone. Drop the local session without a server
  // call that would fail because the user no longer exists.
  await supabase.auth.signOut({ scope: 'local' });
  return {};
}
