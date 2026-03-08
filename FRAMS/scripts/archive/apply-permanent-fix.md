# Apply Permanent Fix for Orphaned Users

## Quick Start

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy and Run the Migration
1. Open the file: `supabase/migrations/20260309000000_auto_create_role_profiles.sql`
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

### Step 3: Check the Results
You should see output like:
```
NOTICE:  Fixed 1 orphaned teacher records
NOTICE:  Fixed 0 orphaned student records
NOTICE:  Auto-created teacher profile for user: teacher@example.com
NOTICE:  === USER PROFILE VERIFICATION ===
NOTICE:  Total users: 5
NOTICE:  Teachers: 1
NOTICE:  Students: 2
NOTICE:  Admins: 2
NOTICE:  Orphaned teachers: 0 (should be 0)
NOTICE:  Orphaned students: 0 (should be 0)
NOTICE:  ✅ All users have proper role profiles!
```

### Step 4: Verify in Your App
1. Restart your app
2. Log in as a teacher
3. The warning should be gone! ✅

## What This Does

### Immediate Effects:
- ✅ Fixes all existing orphaned teacher records
- ✅ Fixes all existing orphaned student records
- ✅ Creates a database trigger for automatic profile creation

### Future Benefits:
- ✅ New teachers automatically get a profile with "Not assigned" department
- ✅ New students automatically get a profile with "PENDING" enrollment number
- ✅ No more orphaned records ever again
- ✅ No more warnings in console

## Verification Query

After running the migration, verify it worked:

```sql
-- This should return 0 for both
SELECT 
  (SELECT COUNT(*) FROM public.users u 
   WHERE u.role = 'teacher' 
   AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = u.id)) as orphaned_teachers,
  (SELECT COUNT(*) FROM public.users u 
   WHERE u.role = 'student' 
   AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = u.id)) as orphaned_students;
```

Expected result:
```
orphaned_teachers | orphaned_students
------------------|------------------
        0         |         0
```

## Test the Trigger

Create a test teacher to verify the trigger works:

```sql
-- Create a test teacher user
INSERT INTO public.users (id, email, full_name, role)
VALUES (gen_random_uuid(), 'test.teacher@example.com', 'Test Teacher', 'teacher')
RETURNING id;

-- Check if profile was auto-created (use the ID from above)
SELECT u.email, u.role, t.department
FROM public.users u
LEFT JOIN public.teachers t ON t.id = u.id
WHERE u.email = 'test.teacher@example.com';
```

You should see:
```
email                    | role    | department
-------------------------|---------|-------------
test.teacher@example.com | teacher | Not assigned
```

## Troubleshooting

### If you see errors:
1. Make sure you're connected to the correct database
2. Check that you have admin permissions
3. Try running the migration in smaller parts

### If orphaned records still exist:
Run the backfill queries manually:

```sql
-- Fix teachers
INSERT INTO public.teachers (id, department)
SELECT u.id, 'Not assigned'
FROM public.users u
WHERE u.role = 'teacher'
  AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Fix students
INSERT INTO public.students (id, enrollment_number, class_id, branch_id, department_id)
SELECT u.id, 'PENDING_' || SUBSTRING(u.id::text, 1, 8), NULL, NULL, NULL
FROM public.users u
WHERE u.role = 'student'
  AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = u.id)
ON CONFLICT (id) DO NOTHING;
```

## Success Indicators

✅ Migration runs without errors  
✅ Verification query shows 0 orphaned records  
✅ Test user creation works  
✅ No warnings in app console  
✅ Teacher dashboard loads without warnings  

## Need Help?

See the full documentation:
- `FRAMS/docs/PERMANENT_FIX_ORPHANED_USERS.md` - Complete guide
- `FRAMS/docs/FIX_ORPHANED_TEACHER.md` - Original issue documentation
- `supabase/migrations/20260309000000_auto_create_role_profiles.sql` - Migration file
