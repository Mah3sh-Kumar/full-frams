# Fix Orphaned Teacher Records

## Issue
You're seeing this warning:
```
WARN  No teacher metadata found for ID: 2f50604d-a472-42b5-b1ce-817ca038fa75
```

This means the teacher user exists in the `users` table but doesn't have a corresponding record in the `teachers` table.

## Impact
- ⚠️ The app still works (shows "Not assigned" for department)
- ⚠️ Warning appears in console logs
- ✅ No crashes or errors
- ✅ Teacher can still use all features

## Solution Options

### Option 1: Use the Debug Screen (Recommended)

1. Log in as an admin
2. Navigate to: **Admin Dashboard → Debug Users**
3. The screen will show orphaned teachers
4. Click the "Fix Orphaned Users" button
5. Refresh the app

### Option 2: Use Supabase SQL Editor

Run this SQL query in your Supabase dashboard:

```sql
-- Insert missing teacher records for all teacher users
INSERT INTO public.teachers (id, department)
SELECT u.id, 'Not assigned'
FROM public.users u
WHERE u.role = 'teacher'
  AND NOT EXISTS (
    SELECT 1 FROM public.teachers t WHERE t.id = u.id
  );
```

### Option 3: Manual Fix via Code

Add this to your app initialization or run it once:

```typescript
import { fixOrphanedUsers } from './lib/debugUsers';

// Run once to fix all orphaned users
await fixOrphanedUsers();
```

### Option 4: Fix Specific Teacher

If you know the teacher's ID, run this in Supabase SQL Editor:

```sql
INSERT INTO public.teachers (id, department)
VALUES ('2f50604d-a472-42b5-b1ce-817ca038fa75', 'Not assigned')
ON CONFLICT (id) DO NOTHING;
```

## Prevention

To prevent this in the future, ensure that when creating teacher accounts:

1. **During signup** (in `AuthContext.tsx`):
   ```typescript
   if (role === 'teacher') {
       await createTeacherProfile(userId, department || 'Not assigned');
   }
   ```

2. **When admin creates teachers** (in admin panel):
   - Always create both `users` and `teachers` records
   - Use the `createTeacherProfile()` function

3. **Database trigger** (optional):
   You could create a database trigger to automatically create teacher records:
   
   ```sql
   CREATE OR REPLACE FUNCTION create_teacher_profile()
   RETURNS TRIGGER AS $$
   BEGIN
     IF NEW.role = 'teacher' THEN
       INSERT INTO public.teachers (id, department)
       VALUES (NEW.id, 'Not assigned')
       ON CONFLICT (id) DO NOTHING;
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER trigger_create_teacher_profile
   AFTER INSERT ON public.users
   FOR EACH ROW
   EXECUTE FUNCTION create_teacher_profile();
   ```

## Verification

After fixing, verify the teacher record exists:

```sql
SELECT u.email, u.role, t.department
FROM public.users u
LEFT JOIN public.teachers t ON t.id = u.id
WHERE u.id = '2f50604d-a472-42b5-b1ce-817ca038fa75';
```

Expected result:
```
email              | role    | department
-------------------|---------|-------------
teacher@email.com  | teacher | Not assigned
```

## Why This Happens

Common causes:
1. Teacher account created before the `teachers` table existed
2. Manual user creation in Supabase without creating teacher profile
3. Database migration that didn't backfill existing teachers
4. Error during signup that created user but failed to create teacher profile

## Related Files

- `FRAMS/lib/debugUsers.ts` - Contains `fixOrphanedUsers()` function
- `FRAMS/screens/admin/DebugUsers.tsx` - Admin UI for fixing orphaned users
- `FRAMS/lib/database.ts` - Contains `createTeacherProfile()` function
- `FRAMS/context/AuthContext.tsx` - Signup flow that creates profiles
