# Permanent Fix for Orphaned User Records

## Overview
This document describes the permanent solution to prevent orphaned teacher/student records.

## Problem
When users are created with `role='teacher'` or `role='student'`, they need corresponding records in the `teachers` or `students` tables. Previously, if these records weren't created, you'd see warnings like:
```
WARN  No teacher metadata found for ID: 2f50604d-a472-42b5-b1ce-817ca038fa75
```

## Permanent Solution

### Database Trigger (Automatic)
A database trigger now automatically creates teacher/student profiles when users are created.

**Migration File**: `supabase/migrations/20260309000000_auto_create_role_profiles.sql`

### What the Migration Does:

#### 1. **Backfills Existing Orphaned Records**
```sql
-- Fixes all existing teachers without profiles
INSERT INTO public.teachers (id, department)
SELECT u.id, 'Not assigned'
FROM public.users u
WHERE u.role = 'teacher'
  AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = u.id);

-- Fixes all existing students without profiles
INSERT INTO public.students (id, enrollment_number, ...)
SELECT u.id, 'PENDING_' || SUBSTRING(u.id::text, 1, 8), ...
FROM public.users u
WHERE u.role = 'student'
  AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = u.id);
```

#### 2. **Creates Auto-Creation Function**
```sql
CREATE OR REPLACE FUNCTION public.auto_create_role_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'teacher' THEN
    INSERT INTO public.teachers (id, department)
    VALUES (NEW.id, 'Not assigned')
    ON CONFLICT (id) DO NOTHING;
  
  ELSIF NEW.role = 'student' THEN
    INSERT INTO public.students (id, enrollment_number, ...)
    VALUES (NEW.id, 'PENDING_' || SUBSTRING(NEW.id::text, 1, 8), ...)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 3. **Creates Trigger**
```sql
CREATE TRIGGER trigger_auto_create_role_profile
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_role_profile();
```

## How to Apply

### Option 1: Run Migration in Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20260309000000_auto_create_role_profiles.sql`
4. Paste and run the SQL
5. Check the output for verification messages

### Option 2: Use Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or apply specific migration
supabase migration up
```

### Option 3: Manual Application

If you prefer to apply manually:

```sql
-- 1. Fix existing orphaned teachers
INSERT INTO public.teachers (id, department)
SELECT u.id, 'Not assigned'
FROM public.users u
WHERE u.role = 'teacher'
  AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 2. Fix existing orphaned students
INSERT INTO public.students (id, enrollment_number, class_id, branch_id, department_id)
SELECT u.id, 'PENDING_' || SUBSTRING(u.id::text, 1, 8), NULL, NULL, NULL
FROM public.users u
WHERE u.role = 'student'
  AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 3. Create the function and trigger (copy from migration file)
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check for orphaned teachers (should return 0)
SELECT COUNT(*) as orphaned_teachers
FROM public.users u
WHERE u.role = 'teacher'
  AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = u.id);

-- Check for orphaned students (should return 0)
SELECT COUNT(*) as orphaned_students
FROM public.users u
WHERE u.role = 'student'
  AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = u.id);

-- View all users with their profiles
SELECT 
  u.email,
  u.role,
  CASE 
    WHEN u.role = 'teacher' THEN 
      CASE WHEN t.id IS NOT NULL THEN '✅ Has profile' ELSE '❌ Missing' END
    WHEN u.role = 'student' THEN 
      CASE WHEN s.id IS NOT NULL THEN '✅ Has profile' ELSE '❌ Missing' END
    ELSE '✅ Admin (no profile needed)'
  END as profile_status,
  COALESCE(t.department, s.enrollment_number, 'N/A') as details
FROM public.users u
LEFT JOIN public.teachers t ON t.id = u.id AND u.role = 'teacher'
LEFT JOIN public.students s ON s.id = u.id AND u.role = 'student'
ORDER BY u.created_at DESC;
```

## What Happens Now

### For New Users:
1. User is created in `users` table with `role='teacher'` or `role='student'`
2. Trigger automatically fires
3. Corresponding record is created in `teachers` or `students` table
4. No orphaned records! ✅

### Default Values:
- **Teachers**: `department = 'Not assigned'`
- **Students**: `enrollment_number = 'PENDING_xxxxxxxx'` (where x is part of user ID)
- **Students**: `class_id`, `branch_id`, `department_id` = `NULL` (to be assigned by admin)

### Admin Workflow:
1. Teacher signs up → Profile auto-created with "Not assigned" department
2. Admin assigns proper department via admin panel
3. Student signs up → Profile auto-created with "PENDING" enrollment
4. Admin assigns proper enrollment number, class, branch, and department

## Benefits

✅ **No more orphaned records** - Automatic creation prevents the issue  
✅ **No more warnings** - All users have proper profiles  
✅ **Backward compatible** - Fixes existing orphaned records  
✅ **Zero maintenance** - Trigger runs automatically  
✅ **Graceful defaults** - Users can start using the app immediately  
✅ **Admin-friendly** - Clear indicators for records needing assignment  

## Testing

Test the trigger by creating a new user:

```sql
-- Test teacher creation
INSERT INTO public.users (id, email, full_name, role)
VALUES (gen_random_uuid(), 'test.teacher@example.com', 'Test Teacher', 'teacher');

-- Verify teacher profile was created
SELECT u.email, t.department
FROM public.users u
INNER JOIN public.teachers t ON t.id = u.id
WHERE u.email = 'test.teacher@example.com';
-- Should show: test.teacher@example.com | Not assigned

-- Test student creation
INSERT INTO public.users (id, email, full_name, role)
VALUES (gen_random_uuid(), 'test.student@example.com', 'Test Student', 'student');

-- Verify student profile was created
SELECT u.email, s.enrollment_number
FROM public.users u
INNER JOIN public.students s ON s.id = u.id
WHERE u.email = 'test.student@example.com';
-- Should show: test.student@example.com | PENDING_xxxxxxxx
```

## Rollback (If Needed)

If you need to remove the trigger:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_auto_create_role_profile ON public.users;

-- Remove function
DROP FUNCTION IF EXISTS public.auto_create_role_profile();

-- Note: This does NOT remove the profiles that were created
-- Only prevents future auto-creation
```

## Related Files

- `supabase/migrations/20260309000000_auto_create_role_profiles.sql` - Migration file
- `FRAMS/lib/debugUsers.ts` - Manual fix utilities (now mostly unnecessary)
- `FRAMS/screens/admin/DebugUsers.tsx` - Admin debug screen
- `FRAMS/lib/database.ts` - Contains `createTeacherProfile()` and `createStudentProfile()`
- `FRAMS/context/AuthContext.tsx` - Signup flow (now has automatic backup)

## Migration Status

- ✅ Migration file created
- ⏳ Needs to be applied to database
- ⏳ Needs verification after application

## Next Steps

1. Apply the migration using one of the methods above
2. Verify no orphaned records exist
3. Test by creating a new teacher/student user
4. Remove the warning from your logs! 🎉
