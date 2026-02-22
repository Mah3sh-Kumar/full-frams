import { supabase } from './supabase';

/**
 * Admin-only function to reset a user's password
 * @param userId - The UUID of the user whose password should be reset
 * @param newPassword - The new password to set
 * @returns Success status and message or error
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ data: any; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('reset_user_password', {
      target_user_id: userId,
      new_password: newPassword
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Get all users with verification status (admin only)
 * Used for user management in admin dashboard
 */
export async function getAllUsers(): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        is_verified,
        verified_at,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Verify a user account (admin only)
 * @param userId - The UUID of the user to verify
 * @returns Success status or error
 */
export async function verifyUser(userId: string): Promise<{ data: any; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('verify_user', {
      target_user_id: userId
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Unverify a user account (admin only)
 * @param userId - The UUID of the user to unverify
 * @returns Success status or error
 */
export async function unverifyUser(userId: string): Promise<{ data: any; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('unverify_user', {
      target_user_id: userId
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Update user role (admin only)
 *
 * SECURITY: Routes through update_user_role RPC (SECURITY DEFINER).
 * Direct .update({ role }) on public.users bypasses RLS and allows
 * privilege escalation by any authenticated user. The RPC enforces
 * admin-only access at the database level.
 *
 * @param userId - The UUID of the user
 * @param newRole - The new role to assign
 * @returns Success status or error
 */
export async function updateUserRole(
  userId: string,
  newRole: 'admin' | 'teacher' | 'student'
): Promise<{ data: any; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('update_user_role', {
      target_user_id: userId,
      new_role: newRole
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Verify multiple user accounts in batch (admin only)
 * @param userIds - Array of user UUIDs to verify
 * @returns Success status or error
 */
export async function verifyUsersBatch(userIds: string[]): Promise<{ data: any; error: string | null }> {
  try {
    const results = await Promise.all(userIds.map(id => verifyUser(id)));

    const errors = results.filter(r => r.error).map(r => r.error);
    if (errors.length > 0) {
      return { data: null, error: `Failed to verify some users: ${errors.join(', ')}` };
    }

    return { data: 'All users verified successfully', error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Delete a user and all related data (admin only)
 *
 * SECURITY: Routes through delete_user RPC (SECURITY DEFINER).
 * The RPC deletes both the public.users row AND the auth.users entry so
 * the account is fully removed. The anon client cannot call
 * auth.admin.deleteUser() directly.
 *
 * @param userId - The UUID of the user to delete
 * @returns Success status or error
 */
export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.rpc('delete_user', {
      target_user_id: userId
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}
