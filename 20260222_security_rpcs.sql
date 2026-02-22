-- ==============================================================================
-- FRAMS : SUPPLEMENTARY RPC SECURITY MIGRATION
-- ==============================================================================
-- File    : 20260222_security_rpcs.sql
-- Date    : 2026-02-22
-- Purpose : Create SECURITY DEFINER RPCs required by the admin.ts security fix.
--           These replace the direct .update({role}) / .delete() patterns that
--           allowed privilege escalation and incomplete user deletion.
--
-- REQUIRED BEFORE:
--   * Running the FRAMS app with the updated admin.ts (which calls these RPCs).
--   * These functions MUST be created AFTER the schema consolidation migration.
--
-- EXECUTION:
--   Paste the entire file into the Supabase SQL Editor and run.
-- ==============================================================================

BEGIN;

-- ============================================================
-- FUNCTION 1: update_user_role
-- ============================================================
-- Called by admin.ts updateUserRole()
-- SECURITY: Only allows admins to change user roles.
--           Prevents privilege escalation via client-side role updates.
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_user_role(
    target_user_id UUID,
    new_role       TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    allowed_roles TEXT[] := ARRAY['admin', 'teacher', 'student'];
    result        RECORD;
BEGIN
    -- 1. Enforce caller is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN: Only admins can update user roles.'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Validate role value
    IF new_role <> ALL(allowed_roles) THEN
        RAISE EXCEPTION 'INVALID_ROLE: Role must be one of: admin, teacher, student.'
            USING ERRCODE = '22023';
    END IF;

    -- 3. Prevent self-demotion (admin removing their own admin status)
    IF target_user_id = auth.uid() AND new_role <> 'admin' THEN
        RAISE EXCEPTION 'FORBIDDEN: Admins cannot remove their own admin role.'
            USING ERRCODE = '42501';
    END IF;

    -- 4. Update the role
    UPDATE public.users
    SET role = new_role
    WHERE id = target_user_id
    RETURNING id INTO result;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: User % not found.', target_user_id
            USING ERRCODE = 'P0002';
    END IF;

    -- 5. Audit log
    INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, metadata)
    VALUES (
        auth.uid(),
        'UPDATE_USER_ROLE',
        'users',
        target_user_id,
        jsonb_build_object('new_role', new_role)
    );

    RETURN jsonb_build_object('success', true, 'user_id', target_user_id, 'new_role', new_role);
END;
$$;

-- Grant execute to authenticated users (the function body enforces admin-only)
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;

-- ============================================================
-- FUNCTION 2: delete_user
-- ============================================================
-- Called by admin.ts deleteUser()
-- SECURITY: Deletes BOTH public.users and auth.users rows.
--           The anon client cannot call auth.admin.deleteUser() directly.
--           This is the only safe way to fully remove a user account.
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_user(
    target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- 1. Enforce caller is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN: Only admins can delete users.'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Prevent self-deletion
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'FORBIDDEN: Admins cannot delete their own account.'
            USING ERRCODE = '42501';
    END IF;

    -- 3. Audit before deletion (so we have a record)
    INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, metadata)
    SELECT
        auth.uid(),
        'DELETE_USER',
        'users',
        target_user_id,
        jsonb_build_object(
            'email',     u.email,
            'role',      u.role,
            'full_name', u.full_name
        )
    FROM public.users u
    WHERE u.id = target_user_id;

    -- 4. Delete role-specific records (FK cascade may handle this, but be explicit)
    DELETE FROM public.students  WHERE id = target_user_id;
    DELETE FROM public.teachers  WHERE id = target_user_id;

    -- 5. Delete public.users row (auth row will be orphaned unless step 6 runs)
    DELETE FROM public.users WHERE id = target_user_id;

    -- 6. Delete from auth.users (requires SECURITY DEFINER + search_path = auth)
    DELETE FROM auth.users WHERE id = target_user_id;

    RETURN jsonb_build_object('success', true, 'deleted_user_id', target_user_id);
END;
$$;

-- Grant execute to authenticated users (the function body enforces admin-only)
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- ============================================================
-- FUNCTION 3: verify_user  (ensure it exists idempotently)
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_user(
    target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN: Only admins can verify users.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.users
    SET is_verified = TRUE,
        verified_at = NOW()
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: User % not found.', target_user_id
            USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, metadata)
    VALUES (auth.uid(), 'VERIFY_USER', 'users', target_user_id, '{}'::JSONB);

    RETURN jsonb_build_object('success', true, 'user_id', target_user_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.verify_user(UUID) TO authenticated;

-- ============================================================
-- FUNCTION 4: unverify_user  (ensure it exists idempotently)
-- ============================================================
CREATE OR REPLACE FUNCTION public.unverify_user(
    target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN: Only admins can unverify users.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.users
    SET is_verified = FALSE,
        verified_at = NULL
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: User % not found.', target_user_id
            USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, metadata)
    VALUES (auth.uid(), 'UNVERIFY_USER', 'users', target_user_id, '{}'::JSONB);

    RETURN jsonb_build_object('success', true, 'user_id', target_user_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.unverify_user(UUID) TO authenticated;

COMMIT;

-- ==============================================================================
-- HOW TO VERIFY:
-- After running, execute in Supabase SQL Editor:
--
--   SELECT routine_name FROM information_schema.routines
--   WHERE routine_schema = 'public'
--     AND routine_name IN ('update_user_role', 'delete_user', 'verify_user', 'unverify_user');
--   -- Expect 4 rows
--
-- ==============================================================================
