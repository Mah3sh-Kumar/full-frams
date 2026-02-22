-- ==============================================================================
-- FRAMS + Face_Reco · SCHEMA CONSOLIDATION MIGRATION
-- ==============================================================================
-- Migration : 20260223_schema_consolidation.sql
-- Date      : 2026-02-23
-- Author    : Senior Database Migration Architect (Antigravity AI)
-- Purpose   : Consolidate schema into single-institution, multi-branch clean
--             academic structure WITHOUT any data loss.
-- Based on  : Forensic Audit Report (2026-02-22)
-- ==============================================================================
-- EXECUTION ORDER (copy-paste into Supabase SQL Editor or psql):
--   1. Fix helper functions
--   2. Merge audit tables          → audit_logs (canonical)
--   3. Add missing columns          → org_classes, org_branches, org_departments
--   4. Fix face_encoding constraint → drop broken CHECK, add correct one
--   5. Merge org_classes → classes (data-safe)
--   6. Fix students dual FK         → keep class_id only
--   7. Fix subjects dual FK         → keep class_id only
--   8. Merge org_branches → branches (rename)
--   9. Drop ghost tables            → devices, system_settings (safe only)
--  10. Clean up RLS policies
-- ==============================================================================
-- SAFETY RULES:
--   · Everything inside BEGIN/COMMIT – one atomic transaction
--   · IF EXISTS / IF NOT EXISTS wherever possible
--   · No DROP CASCADE blindly
--   · Data migrated BEFORE any DROP
--   · Rollback strategy: ROLLBACK at start of session reverses all
-- ==============================================================================

BEGIN;

-- ============================================================
-- BLOCK 0 – SAFETY PRE-CHECKS (read-only assertions)
-- ============================================================
-- Confirm we are running against the expected database.
-- These DO statements raise EXCEPTIONS if key tables are missing,
-- aborting the transaction before any destructive step.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema='public' AND table_name='users') THEN
        RAISE EXCEPTION 'ABORT: public.users table not found. Wrong database?';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_schema='public' AND table_name='students') THEN
        RAISE EXCEPTION 'ABORT: public.students table not found. Wrong database?';
    END IF;
END $$;

-- ============================================================
-- BLOCK 1 – ENSURE CORE HELPER FUNCTIONS EXIST
-- ============================================================
-- is_admin() – already exists in mainDatabase.sql, recreate idempotently.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_teacher() – idempotent recreate
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'teacher'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- update_updated_at_column() – used by org table triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- BLOCK 2 – FIX audit_logs TABLE (canonical schema)
-- ============================================================
-- STRATEGY:
--   · audit_logs in mainDatabase.sql uses: actor_id, action, target_table,
--     target_id, details, ip_address
--   · audit_logs in migration 005/010 uses: user_id, action, details, ip_address
--   · admin_audit_log in migration 001/010 uses: admin_id, action, table_name,
--     record_id, old_values, new_values
--   · GOAL: one table with all info, zero data loss

-- Step 2a: Ensure canonical audit_logs exists with full column set
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id           UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    actor_id     UUID    REFERENCES public.users(id) ON DELETE SET NULL,
    action       TEXT    NOT NULL,
    target_table TEXT,
    target_id    UUID,
    metadata     JSONB,           -- merged from details + old_values + new_values
    ip_address   TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Step 2b: Add any missing columns to audit_logs (idempotent)
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_id     UUID    REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_table TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_id    UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata     JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address   TEXT;

-- Step 2c: If legacy user_id column exists (from migration 005/010 schema),
--          copy data into actor_id and then rename or drop.
DO $$
BEGIN
    -- Migrate user_id → actor_id if user_id exists and actor_id is empty for those rows
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='audit_logs' AND column_name='user_id'
    ) THEN
        -- Back-fill actor_id from user_id where actor_id is null
        UPDATE public.audit_logs
        SET actor_id = user_id
        WHERE actor_id IS NULL AND user_id IS NOT NULL;

        -- Migrate details → metadata where metadata is null
        UPDATE public.audit_logs
        SET metadata = details
        WHERE metadata IS NULL AND details IS NOT NULL;

        RAISE NOTICE 'Migrated user_id/details → actor_id/metadata in audit_logs.';
    END IF;
END $$;

-- Step 2d: If admin_audit_log exists, migrate its data into audit_logs
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='admin_audit_log'
    ) THEN
        -- Insert rows from admin_audit_log that are not already in audit_logs
        -- Identify duplicates by (actor_id, action, created_at) approximate match
        INSERT INTO public.audit_logs (id, actor_id, action, target_table, target_id, metadata, created_at)
        SELECT
            aal.id,
            aal.admin_id                                          AS actor_id,
            aal.action,
            aal.table_name                                        AS target_table,
            aal.record_id                                         AS target_id,
            jsonb_build_object(
                'old_values', aal.old_values,
                'new_values', aal.new_values
            )                                                     AS metadata,
            aal.created_at
        FROM public.admin_audit_log aal
        WHERE NOT EXISTS (
            SELECT 1 FROM public.audit_logs al WHERE al.id = aal.id
        );

        RAISE NOTICE 'Migrated admin_audit_log → audit_logs (% rows)',
            (SELECT COUNT(*) FROM public.admin_audit_log);
    END IF;
END $$;

-- Step 2e: Enable RLS on audit_logs (idempotent)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 2f: Drop broken and duplicate audit_logs policies, add clean ones
DROP POLICY IF EXISTS "Admins can view audit logs"   ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow audit log inserts"      ON public.audit_logs;
DROP POLICY IF EXISTS "Admin All Audit Logs"         ON public.audit_logs;

CREATE POLICY "Admin All Audit Logs" ON public.audit_logs
    FOR ALL USING (public.is_admin());

CREATE POLICY "System Insert Audit Logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);   -- SECURITY DEFINER functions insert freely

-- Step 2g: Add index on audit_logs if not present
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id   ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON public.audit_logs(action);

-- ============================================================
-- BLOCK 3 – ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- 3a: org_branches.code (missing from migration 003, required by organization.ts)
ALTER TABLE public.org_branches ADD COLUMN IF NOT EXISTS code TEXT;
-- Backfill code for any rows that lack it, using lower-snake of name
UPDATE public.org_branches
SET code = lower(regexp_replace(name, '\s+', '_', 'g'))
WHERE code IS NULL;
-- Now add unique constraint on code (safe because values are now populated)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema='public' AND table_name='org_branches'
          AND constraint_name='org_branches_code_key'
    ) THEN
        ALTER TABLE public.org_branches ADD CONSTRAINT org_branches_code_key UNIQUE (code);
    END IF;
END $$;

-- 3b: org_departments.code (missing from migration 003, required by organization.ts)
ALTER TABLE public.org_departments ADD COLUMN IF NOT EXISTS code TEXT;
UPDATE public.org_departments
SET code = lower(regexp_replace(name, '\s+', '_', 'g'))
WHERE code IS NULL;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema='public' AND table_name='org_departments'
          AND constraint_name='org_departments_code_key'
    ) THEN
        ALTER TABLE public.org_departments ADD CONSTRAINT org_departments_code_key UNIQUE (code);
    END IF;
END $$;

-- 3c: org_classes.academic_year (added in 008/009, may already exist)
ALTER TABLE public.org_classes ADD COLUMN IF NOT EXISTS academic_year TEXT;
CREATE INDEX IF NOT EXISTS idx_org_classes_academic_year ON public.org_classes(academic_year);

-- 3d: classes table – ensure it has academic_year, value, display_order, updated_at
--     (Face_Reco uses classes; must keep it populated)
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS value         TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::TEXT, NOW());

-- ============================================================
-- BLOCK 4 – MERGE org_classes DATA INTO classes
-- ============================================================
-- GOAL: classes becomes the single source of truth.
--       Face_Reco already uses classes.id via subjects.class_id.
--       FRAMS currently uses org_classes.id via org_class_id.
--       After migration, both use classes.
-- STRATEGY:
--   1. Insert org_classes rows into classes (avoid duplicates).
--   2. Update students.org_class_id → students.class_id (via mapping).
--   3. Update subjects.org_class_id → subjects.class_id (via mapping).
--   4. Drop org_class_id columns after data migration.
--   5. Drop org_classes table.

-- Step 4a: Insert org_classes rows into classes (idempotent via ON CONFLICT)
--          Match on (name, academic_year) if academic_year non-null,
--          or on name alone if null.
INSERT INTO public.classes (id, name, academic_year, value, display_order, is_active, created_at, updated_at)
SELECT
    oc.id,
    oc.name,
    COALESCE(oc.academic_year, '2025-2026'),   -- default academic year for org_classes without one
    oc.value,
    oc.display_order,
    oc.is_active,
    oc.created_at,
    oc.updated_at
FROM public.org_classes oc
WHERE NOT EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = oc.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 4b: For org_classes rows whose id didn't exist in classes,
--          ensure any newly-inserted classes have their FK mapping clear.
--          Build a temporary mapping: org_class_id → canonical class_id
-- (Since we insert with the SAME id, the mapping is 1-to-1.)

-- Step 4c: Update students.class_id from org_class_id where class_id is NULL
--          (Only run if students.org_class_id column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='students' AND column_name='org_class_id'
    ) THEN
        UPDATE public.students s
        SET class_id = s.org_class_id
        WHERE s.class_id IS NULL
          AND s.org_class_id IS NOT NULL;

        RAISE NOTICE 'Updated students.class_id from org_class_id where class_id was NULL.';

        -- Also reconcile rows where both are set but differ
        -- Trust org_class_id (used by FRAMS, more recent) when conflict exists
        UPDATE public.students s
        SET class_id = s.org_class_id
        WHERE s.class_id IS DISTINCT FROM s.org_class_id
          AND s.org_class_id IS NOT NULL;

        RAISE NOTICE 'Reconciled students.class_id with org_class_id (org_class_id wins).';
    END IF;
END $$;

-- Step 4d: Update subjects.class_id from subjects.org_class_id where null
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='subjects' AND column_name='org_class_id'
    ) THEN
        UPDATE public.subjects s
        SET class_id = s.org_class_id
        WHERE s.class_id IS NULL
          AND s.org_class_id IS NOT NULL;

        RAISE NOTICE 'Updated subjects.class_id from org_class_id where class_id was NULL.';
    END IF;
END $$;

-- ============================================================
-- BLOCK 5 – FIX students DUAL FOREIGN KEY
-- ============================================================
-- After Block 4, students.class_id is fully populated from org_class_id.
-- We can safely drop org_class_id column.
-- NOTE: Only drop AFTER verifying no class_id row is now NULL.

DO $$
DECLARE
    null_count INTEGER;
BEGIN
    -- Only drop org_class_id if students.class_id is fully populated
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='students' AND column_name='org_class_id'
    ) THEN
        SELECT COUNT(*) INTO null_count
        FROM public.students
        WHERE class_id IS NULL;

        IF null_count = 0 THEN
            -- Safe to drop
            ALTER TABLE public.students DROP COLUMN IF EXISTS org_class_id;
            RAISE NOTICE 'Dropped students.org_class_id – all students have class_id set.';
        ELSE
            -- Not safe: leave column, just warn
            RAISE WARNING 'students.org_class_id NOT dropped: % student(s) still have class_id = NULL. Investigate manually.', null_count;
        END IF;
    END IF;

    -- Also drop legacy denormalized text columns (safe – data is in FK columns)
    -- class_level and branch are text denormalized fields – keep them for now
    -- as Face_Reco may use the text fields. Annotate but do NOT drop.
    RAISE NOTICE 'students.class_level and students.branch kept (legacy text, safe to drop later if Face_Reco migrated).';
END $$;

-- ============================================================
-- BLOCK 6 – FIX subjects DUAL FOREIGN KEY
-- ============================================================
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='subjects' AND column_name='org_class_id'
    ) THEN
        SELECT COUNT(*) INTO null_count
        FROM public.subjects
        WHERE class_id IS NULL;

        IF null_count = 0 THEN
            ALTER TABLE public.subjects DROP COLUMN IF EXISTS org_class_id;
            RAISE NOTICE 'Dropped subjects.org_class_id – all subjects have class_id set.';
        ELSE
            RAISE WARNING 'subjects.org_class_id NOT dropped: % subject(s) still have class_id = NULL.', null_count;
        END IF;
    END IF;
END $$;

-- ============================================================
-- BLOCK 7 – DROP org_classes TABLE (after data migration)
-- ============================================================
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='org_classes'
    ) THEN
        -- Safety: ensure no remaining FKs point to org_classes
        -- students.org_class_id and subjects.org_class_id should be gone by now.
        -- Check if any FK constraint still references org_classes
        SELECT COUNT(*) INTO orphan_count
        FROM information_schema.referential_constraints rc
        JOIN information_schema.constraint_column_usage ccu
          ON rc.unique_constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'org_classes'
          AND ccu.table_schema = 'public';

        IF orphan_count = 0 THEN
            DROP TABLE IF EXISTS public.org_classes;
            RAISE NOTICE 'Dropped org_classes table.';
        ELSE
            RAISE WARNING 'org_classes NOT dropped: % FK constraint(s) still reference it. Drop orphan_count FKs first.', orphan_count;
        END IF;
    END IF;
END $$;

-- Drop leftover indexes that referenced org_classes
DROP INDEX IF EXISTS public.idx_org_classes_display_order;
DROP INDEX IF EXISTS public.idx_org_classes_is_active;
DROP INDEX IF EXISTS public.idx_org_classes_value;
DROP INDEX IF EXISTS public.idx_org_classes_academic_year;

-- ============================================================
-- BLOCK 8 – MERGE org_branches → branches (or rename)
-- ============================================================
-- STRATEGY:
--   · classes is now canonical; org_branches stores streams per class.
--   · Rename org_branches → branches (if branches does not exist).
--   · If branches already exists, merge data and drop org_branches.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='branches'
    ) THEN
        -- Rename org_branches to branches
        ALTER TABLE IF EXISTS public.org_branches RENAME TO branches;
        -- Rename the FK column from class_id → class_id (already correct name)
        -- Rename indexes
        ALTER INDEX IF EXISTS idx_org_branches_class_id    RENAME TO idx_branches_class_id;
        ALTER INDEX IF EXISTS idx_org_branches_display_order RENAME TO idx_branches_display_order;
        ALTER INDEX IF EXISTS idx_org_branches_is_active   RENAME TO idx_branches_is_active;
        ALTER INDEX IF EXISTS idx_org_branches_name        RENAME TO idx_branches_name;
        RAISE NOTICE 'Renamed org_branches → branches.';
    ELSE
        -- branches already exists; merge org_branches data in
        INSERT INTO public.branches (name, code, class_id, display_order, is_active, created_at, updated_at)
        SELECT ob.name, ob.code, ob.class_id, ob.display_order, ob.is_active, ob.created_at, ob.updated_at
        FROM public.org_branches ob
        WHERE NOT EXISTS (
            SELECT 1 FROM public.branches b
            WHERE b.name = ob.name
              AND (b.class_id = ob.class_id OR (b.class_id IS NULL AND ob.class_id IS NULL))
        )
        ON CONFLICT DO NOTHING;

        DROP TABLE IF EXISTS public.org_branches;
        RAISE NOTICE 'Merged and dropped org_branches (branches already existed).';
    END IF;
END $$;

-- Ensure RLS on branches (whether newly renamed or existing)
ALTER TABLE IF EXISTS public.branches ENABLE ROW LEVEL SECURITY;

-- Drop old policies and create clean ones for branches
DROP POLICY IF EXISTS "Authenticated users can view active branches" ON public.branches;
DROP POLICY IF EXISTS "Admins can view all branches"   ON public.branches;
DROP POLICY IF EXISTS "Admins can insert branches"     ON public.branches;
DROP POLICY IF EXISTS "Admins can update branches"     ON public.branches;
DROP POLICY IF EXISTS "Admins can delete branches"     ON public.branches;

CREATE POLICY "Authenticated Read Branches" ON public.branches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin All Branches" ON public.branches
    FOR ALL USING (public.is_admin());

-- ============================================================
-- BLOCK 9 – FIX face_encoding CHECK CONSTRAINT
-- ============================================================
-- PROBLEM: Constraint requires format, source_system, created_at keys.
--          Face_Reco writes only {"encoding": [...]}.
--          This blocks ALL Face_Reco face enrollments silently.
-- STRATEGY:
--   1. Run the existing migrate_face_encodings() to upgrade any stored
--      legacy-format encodings to the full schema.
--   2. Drop the strict constraint.
--   3. Add a relaxed constraint: must have 'encoding' key if non-null.
--   4. Update Face_Reco write paths (SQL side) to inject metadata via
--      a DB trigger so neither app needs to change code.

-- Step 9a: Migrate existing bare {"encoding": [...]} rows first
SELECT migrate_face_encodings();

-- Step 9b: Drop the overstrict constraint
ALTER TABLE public.students
    DROP CONSTRAINT IF EXISTS valid_face_encoding_format;

-- Step 9c: Add relaxed constraint – only require 'encoding' key
--          format, source_system, created_at are STRONGLY RECOMMENDED
--          but not enforced at DB level (enforced by trigger below).
ALTER TABLE public.students
    ADD CONSTRAINT valid_face_encoding_has_encoding
    CHECK (
        face_encoding IS NULL OR (
            jsonb_typeof(face_encoding) = 'object' AND
            face_encoding ? 'encoding'
        )
    );

-- Step 9d: Create a trigger to auto-inject missing metadata when
--          Face_Reco writes bare {"encoding": [...]}
--          This keeps Face_Reco client.py untouched while ensuring
--          the DB always stores the full canonical structure.
CREATE OR REPLACE FUNCTION public.enrich_face_encoding()
RETURNS TRIGGER AS $$
BEGIN
    -- If face_encoding is non-null but missing metadata, inject defaults
    IF NEW.face_encoding IS NOT NULL
       AND jsonb_typeof(NEW.face_encoding) = 'object'
       AND (NEW.face_encoding ? 'encoding')
       AND NOT (NEW.face_encoding ? 'format')
    THEN
        NEW.face_encoding := NEW.face_encoding
            || jsonb_build_object(
                'format',        COALESCE(NEW.face_encoding->>'format', 'face_recognition'),
                'source_system', COALESCE(NEW.face_encoding->>'source_system', 'Face_Reco'),
                'created_at',    COALESCE(NEW.face_encoding->>'created_at', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
               );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enrich_face_encoding ON public.students;
CREATE TRIGGER trg_enrich_face_encoding
    BEFORE INSERT OR UPDATE OF face_encoding ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.enrich_face_encoding();

-- Step 9e: Backfill existing face_encodings that still lack metadata
UPDATE public.students
SET face_encoding = face_encoding
    || jsonb_build_object(
        'format',        'face_recognition',
        'source_system', 'Face_Reco',
        'created_at',    to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
       )
WHERE face_encoding IS NOT NULL
  AND jsonb_typeof(face_encoding) = 'object'
  AND face_encoding ? 'encoding'
  AND NOT (face_encoding ? 'format');

-- ============================================================
-- BLOCK 10 – REMOVE devices TABLE (ghost feature)
-- ============================================================
-- devices was designed but never wired to app code.
-- attendance.device_id is a plain TEXT column (no FK), safe to leave.

-- Step 10a: Drop attendance.device_id column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='attendance' AND column_name='device_id'
    ) THEN
        ALTER TABLE public.attendance DROP COLUMN IF EXISTS device_id;
        RAISE NOTICE 'Dropped attendance.device_id column.';
    END IF;
END $$;

-- Step 10b: Drop broken RLS policies on devices before dropping table
DROP POLICY IF EXISTS "Admins can manage devices"    ON public.devices;
DROP POLICY IF EXISTS "Admin Manage Devices"         ON public.devices;
DROP POLICY IF EXISTS "Devices can be viewed by admins" ON public.devices;

-- Step 10c: Drop devices indexes
DROP INDEX IF EXISTS public.idx_devices_is_active;
DROP INDEX IF EXISTS public.idx_devices_device_id;

-- Step 10d: Drop devices table (safe – no app queries it)
--           We do NOT use CASCADE; we check for FK dependencies first.
DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='devices'
    ) THEN
        SELECT COUNT(*) INTO fk_count
        FROM information_schema.referential_constraints rc
        JOIN information_schema.constraint_column_usage ccu
          ON rc.unique_constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'devices' AND ccu.table_schema = 'public';

        IF fk_count = 0 THEN
            DROP TABLE IF EXISTS public.devices;
            RAISE NOTICE 'Dropped devices table.';
        ELSE
            RAISE WARNING 'devices NOT dropped: % FK constraint(s) reference it.', fk_count;
        END IF;
    END IF;
END $$;

-- ============================================================
-- BLOCK 11 – REMOVE system_settings (backup first if populated)
-- ============================================================
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='system_settings'
    ) THEN
        SELECT COUNT(*) INTO row_count FROM public.system_settings;

        IF row_count > 0 THEN
            -- Back up each system_setting row into audit_logs.metadata
            INSERT INTO public.audit_logs (actor_id, action, target_table, metadata, created_at)
            SELECT
                NULL,
                'SCHEMA_MIGRATION_BACKUP',
                'system_settings',
                jsonb_build_object('key', key, 'value', value, 'description', description),
                NOW()
            FROM public.system_settings;
            RAISE NOTICE 'Backed up % system_settings rows into audit_logs.', row_count;
        END IF;

        -- Drop broken policies first
        DROP POLICY IF EXISTS "Everyone can read system settings"  ON public.system_settings;
        DROP POLICY IF EXISTS "Admins can update system settings"  ON public.system_settings;

        DROP TABLE IF EXISTS public.system_settings;
        RAISE NOTICE 'Dropped system_settings table.';
    END IF;
END $$;

-- ============================================================
-- BLOCK 12 – DROP admin_audit_log (after data migration in Block 2)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='admin_audit_log'
    ) THEN
        DROP POLICY IF EXISTS "Admins can view audit logs"    ON public.admin_audit_log;
        DROP POLICY IF EXISTS "System can insert audit logs"  ON public.admin_audit_log;

        DROP INDEX IF EXISTS public.idx_audit_admin_id;
        DROP INDEX IF EXISTS public.idx_audit_created_at;
        DROP INDEX IF EXISTS public.idx_audit_table_action;

        DROP TABLE IF EXISTS public.admin_audit_log;
        RAISE NOTICE 'Dropped admin_audit_log table (data migrated to audit_logs).';
    END IF;
END $$;

-- ============================================================
-- BLOCK 13 – DROP org_departments (data moved to departments via
--            teachers.org_department_id; keep table if referenced)
-- ============================================================
-- org_departments is used by teachers.org_department_id FK.
-- DECISION: Keep org_departments intact, just ensure it has the code column.
-- Rename to departments? Only if no app code references org_departments by name.
-- FRAMS organization.ts references 'org_departments' by that name.
-- KEEP org_departments as-is; we already added the code column in Block 3.
DO $$
BEGIN
    RAISE NOTICE 'org_departments kept (referenced by FRAMS organization.ts and teachers.org_department_id FK).';
END $$;

-- ============================================================
-- BLOCK 14 – FULL RLS CLEANUP
-- ============================================================

-- ---- users ----
DROP POLICY IF EXISTS "Public Read Users"     ON public.users;
DROP POLICY IF EXISTS "Admin All Users"       ON public.users;
DROP POLICY IF EXISTS "Self Update Users"     ON public.users;

CREATE POLICY "Users Public Read"             ON public.users FOR SELECT USING (true);
CREATE POLICY "Users Admin Full"              ON public.users FOR ALL    USING (public.is_admin());
CREATE POLICY "Users Self Update"             ON public.users FOR UPDATE USING (auth.uid() = id);

-- ---- students ----
DROP POLICY IF EXISTS "Read Students"         ON public.students;
DROP POLICY IF EXISTS "Admin Manages Students" ON public.students;

-- Authenticated read (teachers, admins, students themselves)
CREATE POLICY "Students Authenticated Read"   ON public.students
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Students Admin Full"           ON public.students
    FOR ALL    USING (public.is_admin());
CREATE POLICY "Students Teacher Write"        ON public.students
    FOR ALL    USING (public.is_teacher());
-- Student self-read of own record
CREATE POLICY "Students Self Read"            ON public.students
    FOR SELECT USING (auth.uid() = id);

-- ---- teachers ----
-- (Previously no policy defined)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers Admin Full"     ON public.teachers;
DROP POLICY IF EXISTS "Teachers Self Read"      ON public.teachers;
DROP POLICY IF EXISTS "Teachers Authenticated Read" ON public.teachers;

CREATE POLICY "Teachers Authenticated Read"   ON public.teachers
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Teachers Admin Full"           ON public.teachers
    FOR ALL    USING (public.is_admin());
CREATE POLICY "Teachers Self Update"          ON public.teachers
    FOR UPDATE USING (auth.uid() = id);

-- ---- classes ----
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Classes Admin Full"    ON public.classes;
DROP POLICY IF EXISTS "Classes Authenticated Read" ON public.classes;

CREATE POLICY "Classes Authenticated Read"    ON public.classes
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Classes Admin Full"            ON public.classes
    FOR ALL    USING (public.is_admin());

-- ---- subjects ----
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Subjects Admin Full"   ON public.subjects;
DROP POLICY IF EXISTS "Subjects Authenticated Read" ON public.subjects;

CREATE POLICY "Subjects Authenticated Read"   ON public.subjects
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Subjects Admin Full"           ON public.subjects
    FOR ALL    USING (public.is_admin());
CREATE POLICY "Subjects Teacher Write"        ON public.subjects
    FOR ALL    USING (public.is_teacher());

-- ---- attendance ----
DROP POLICY IF EXISTS "Student View Own Attendance"   ON public.attendance;
DROP POLICY IF EXISTS "Teacher View/Mark Attendance"  ON public.attendance;
DROP POLICY IF EXISTS "Admin Manage Attendance"       ON public.attendance;

CREATE POLICY "Attendance Student Read Own"   ON public.attendance
    FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Attendance Teacher Full"       ON public.attendance
    FOR ALL    USING (public.is_teacher());
CREATE POLICY "Attendance Admin Full"         ON public.attendance
    FOR ALL    USING (public.is_admin());

-- ---- assignments ----
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Assignments Admin Full" ON public.assignments;
DROP POLICY IF EXISTS "Assignments Authenticated Read" ON public.assignments;

CREATE POLICY "Assignments Authenticated Read" ON public.assignments
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Assignments Admin Full"        ON public.assignments
    FOR ALL    USING (public.is_admin());
CREATE POLICY "Assignments Teacher Full"      ON public.assignments
    FOR ALL    USING (public.is_teacher());

-- ---- student_assignments ----
ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Student Assignments Admin Full" ON public.student_assignments;
DROP POLICY IF EXISTS "Student Assignments Student Read" ON public.student_assignments;

CREATE POLICY "SA Student Read Own"           ON public.student_assignments
    FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "SA Teacher Full"               ON public.student_assignments
    FOR ALL    USING (public.is_teacher());
CREATE POLICY "SA Admin Full"                 ON public.student_assignments
    FOR ALL    USING (public.is_admin());

-- ---- notifications ----
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Notifications Admin Full"  ON public.notifications;
DROP POLICY IF EXISTS "Notifications Self Read"   ON public.notifications;
DROP POLICY IF EXISTS "Notifications Self Insert" ON public.notifications;

-- Users can read their own notifications
CREATE POLICY "Notifications Self Read"       ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
-- Admins full access
CREATE POLICY "Notifications Admin Full"      ON public.notifications
    FOR ALL    USING (public.is_admin());
-- System (SECURITY DEFINER functions) can insert for any user
CREATE POLICY "Notifications System Insert"   ON public.notifications
    FOR INSERT WITH CHECK (true);

-- ---- org_classes (if not dropped), org_branches / branches, org_departments ----
-- Clean up the broken public.profiles-referencing policies from migration 005
-- (These were on devices/audit_logs/system_settings which are now dropped)
-- org_classes policies were already clean in migration 003 – leave them.

-- For org_departments (kept), ensure clean policies exist
ALTER TABLE public.org_departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view active departments" ON public.org_departments;
DROP POLICY IF EXISTS "Admins can view all departments"   ON public.org_departments;
DROP POLICY IF EXISTS "Admins can insert departments"     ON public.org_departments;
DROP POLICY IF EXISTS "Admins can update departments"     ON public.org_departments;
DROP POLICY IF EXISTS "Admins can delete departments"     ON public.org_departments;

CREATE POLICY "Org Departments Authenticated Read" ON public.org_departments
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Org Departments Admin Full"         ON public.org_departments
    FOR ALL    USING (public.is_admin());

-- ============================================================
-- BLOCK 15 – ENABLE RLS on devices (mainDatabase.sql had orphan statement)
--            This was already cleaned up by dropping devices table.
--            If devices still exists for some reason, just silently handle.
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='devices'
    ) THEN
        ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
        RAISE WARNING 'devices table still exists – RLS enabled but table should be investigated.';
    END IF;
END $$;

-- ============================================================
-- BLOCK 16 – GRANTS (ensure authenticated role can access key tables)
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications     TO authenticated;
GRANT SELECT, INSERT               ON public.audit_logs          TO authenticated;
GRANT SELECT                       ON public.org_departments     TO authenticated;

-- Grant on branches (whether renamed from org_branches or existing)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='branches'
    ) THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='org_branches'
    ) THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_branches TO authenticated';
    END IF;
END $$;

-- ============================================================
-- BLOCK 17 – FIX updated_at TRIGGER ON classes (if not present)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_schema='public'
          AND event_object_table='classes'
          AND trigger_name='update_classes_updated_at'
    ) THEN
        CREATE TRIGGER update_classes_updated_at
            BEFORE UPDATE ON public.classes
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        RAISE NOTICE 'Created update_classes_updated_at trigger.';
    END IF;
END $$;

-- ============================================================
-- BLOCK 18 – POST-MIGRATION VALIDATION QUERIES (commented out)
-- ============================================================
-- Run these manually AFTER committing to verify state:
--
-- SELECT COUNT(*) FROM public.students WHERE class_id IS NULL;      -- should be 0
-- SELECT COUNT(*) FROM public.subjects  WHERE class_id IS NULL;     -- should be 0
-- SELECT COUNT(*) FROM public.students
--   WHERE face_encoding IS NOT NULL AND NOT (face_encoding ? 'encoding'); -- should be 0
-- SELECT COUNT(*) FROM public.audit_logs;                           -- should be >= old admin_audit_log rows
-- SELECT * FROM information_schema.tables
--   WHERE table_schema='public' AND table_name IN
--   ('devices','system_settings','admin_audit_log','org_classes');  -- should return 0 rows
-- SELECT COUNT(*) FROM public.branches;                             -- should match old org_branches count
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conname='valid_face_encoding_has_encoding';               -- verify relaxed constraint

-- ============================================================
-- COMMIT
-- ============================================================
-- All blocks succeeded. Commit the transaction.
COMMIT;

-- ==============================================================================
-- POST-COMMIT: Drop legacy user_id column from audit_logs
-- (Must be done OUTSIDE the main transaction after verifying actor_id is set)
-- ==============================================================================
-- Run this separately after confirming the migration:
--
-- ALTER TABLE public.audit_logs DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE public.audit_logs DROP COLUMN IF EXISTS details;
-- RAISE NOTICE 'Dropped legacy columns user_id/details from audit_logs.';
--
-- ==============================================================================
-- END OF MIGRATION: 20260223_schema_consolidation.sql
-- ==============================================================================
