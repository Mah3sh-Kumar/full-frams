# Auto-Sync Teacher Department from Subject Assignments

## Overview
This solution automatically syncs a teacher's department when they are assigned to subjects. The department is derived from the subject's hierarchy: `subject → class → branch → department`.

## Problem
When admins assign teachers to subjects, the teacher's department in the `teachers` table wasn't being updated. This caused:
- Profile showing "Department: Not assigned"
- Dashboard showing "Department: Not assigned"
- Inconsistent data between subject assignments and teacher profiles

## Solution - Database Triggers

### Migration File
`supabase/migrations/20260309100000_auto_sync_teacher_department.sql`

### What It Does

#### 1. **get_department_from_subject(subject_id)** - Helper Function
Gets the department name for a subject by traversing the hierarchy:
```
subject → class → branch → department
```

#### 2. **sync_teacher_department()** - Trigger Function
Automatically updates teacher's department when assigned to a subject:
- Only updates if current department is NULL, empty, or "Not assigned"
- Gets department from the subject being assigned
- Updates `teachers.department` automatically

#### 3. **Trigger on subject_teachers Table**
Fires after INSERT on `subject_teachers`:
```sql
CREATE TRIGGER trigger_sync_teacher_department
  AFTER INSERT ON public.subject_teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_teacher_department();
```

#### 4. **Backfill Existing Data**
Updates all existing teachers who have subject assignments but "Not assigned" department.

#### 5. **sync_teacher_department_manual(teacher_id)** - Manual Sync
Helper function to manually sync a specific teacher's department:
```sql
SELECT public.sync_teacher_department_manual('teacher-uuid-here');
```

## How to Apply

### Step 1: Run the Migration

**Option A - Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20260309100000_auto_sync_teacher_department.sql`
3. Paste and run
4. Check the output for verification

**Option B - Supabase CLI:**
```bash
supabase db push
```

### Step 2: Verify

Run this query to check:
```sql
SELECT 
  u.email,
  t.department,
  COUNT(st.subject_id) as subjects_count
FROM users u
INNER JOIN teachers t ON t.id = u.id
LEFT JOIN subject_teachers st ON st.teacher_id = u.id
WHERE u.role = 'teacher'
GROUP BY u.email, t.department
ORDER BY u.email;
```

Expected result: All teachers with subject assignments should have proper departments.

## How It Works

### Automatic Sync Flow

1. **Admin assigns teacher to subject**
   ```typescript
   await assignTeacherToSubject(teacherId, subjectId);
   ```

2. **INSERT into subject_teachers table**
   ```sql
   INSERT INTO subject_teachers (teacher_id, subject_id, ...)
   VALUES ('teacher-id', 'subject-id', ...);
   ```

3. **Trigger fires automatically**
   ```
   trigger_sync_teacher_department
   ↓
   sync_teacher_department()
   ↓
   get_department_from_subject(subject_id)
   ↓
   UPDATE teachers SET department = 'Computer Science'
   ```

4. **Teacher's profile now shows correct department** ✅

### Example Scenario

**Before:**
```
Teacher: John Doe
Department: Not assigned
Subjects: (none)
```

**Admin assigns subject:**
```
Subject: Data Structures
Class: BSC CS 3rd Year
Branch: Computer Science
Department: Computer Science
```

**After (Automatic):**
```
Teacher: John Doe
Department: Computer Science  ← Auto-updated!
Subjects: Data Structures
```

## Manual Sync (If Needed)

If you need to manually sync a teacher's department:

```sql
-- Sync specific teacher
SELECT public.sync_teacher_department_manual('2f50604d-a472-42b5-b1ce-817ca038fa75');

-- Returns: "Department updated to: Computer Science"
```

Or sync all teachers with "Not assigned":

```sql
DO $$
DECLARE
  v_teacher RECORD;
BEGIN
  FOR v_teacher IN
    SELECT id FROM teachers 
    WHERE department = 'Not assigned' OR department IS NULL
  LOOP
    PERFORM public.sync_teacher_department_manual(v_teacher.id);
  END LOOP;
END $$;
```

## Verification Queries

### Check all teachers and their departments:
```sql
SELECT 
  u.email,
  u.full_name,
  t.department,
  COUNT(st.subject_id) as subjects_taught,
  CASE 
    WHEN t.department IS NULL THEN '❌ NULL'
    WHEN t.department = 'Not assigned' THEN '⚠️ Not assigned'
    ELSE '✅ Assigned'
  END as status
FROM users u
INNER JOIN teachers t ON t.id = u.id
LEFT JOIN subject_teachers st ON st.teacher_id = u.id
WHERE u.role = 'teacher'
GROUP BY u.email, u.full_name, t.department
ORDER BY status, u.email;
```

### Check specific teacher:
```sql
SELECT 
  u.email,
  t.department,
  json_agg(json_build_object(
    'subject', s.name,
    'class', c.name,
    'branch', b.name,
    'department', d.name
  )) as subjects
FROM users u
INNER JOIN teachers t ON t.id = u.id
LEFT JOIN subject_teachers st ON st.teacher_id = u.id
LEFT JOIN subjects s ON s.id = st.subject_id
LEFT JOIN classes c ON c.id = s.class_id
LEFT JOIN branches b ON b.id = c.branch_id
LEFT JOIN org_departments d ON d.id = b.department_id
WHERE u.id = '2f50604d-a472-42b5-b1ce-817ca038fa75'
GROUP BY u.email, t.department;
```

## Edge Cases Handled

### 1. Teacher Already Has Department
- Trigger checks if department is "Not assigned" before updating
- Won't overwrite existing valid departments
- Preserves manually assigned departments

### 2. Teacher Assigned to Multiple Departments
- Uses first subject assignment's department
- Admin can manually override if needed

### 3. Subject Without Department Hierarchy
- Function returns NULL if department can't be determined
- No update occurs, keeps existing department

### 4. Teacher Removed from All Subjects
- Department remains (doesn't revert to "Not assigned")
- Admin can manually update if needed

## Benefits

✅ **Automatic** - No manual intervention needed  
✅ **Consistent** - Department always matches subject assignments  
✅ **Backward Compatible** - Backfills existing data  
✅ **Safe** - Only updates "Not assigned" departments  
✅ **Transparent** - Logs all updates with NOTICE messages  
✅ **Flexible** - Manual sync function available if needed  

## Testing

### Test the trigger:

1. **Create a test teacher:**
```sql
-- Insert test user
INSERT INTO users (id, email, full_name, role)
VALUES (gen_random_uuid(), 'test.teacher@example.com', 'Test Teacher', 'teacher')
RETURNING id;

-- Insert teacher profile (use ID from above)
INSERT INTO teachers (id, department)
VALUES ('teacher-id-from-above', 'Not assigned');
```

2. **Assign to a subject:**
```sql
-- Assign teacher to a subject (use actual subject_id)
INSERT INTO subject_teachers (teacher_id, subject_id, assigned_by)
VALUES ('teacher-id', 'subject-id', 'admin-id');
```

3. **Verify department was updated:**
```sql
SELECT department FROM teachers WHERE id = 'teacher-id';
-- Should show actual department, not "Not assigned"
```

## Rollback (If Needed)

To remove the trigger and functions:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS trigger_sync_teacher_department ON public.subject_teachers;

-- Drop functions
DROP FUNCTION IF EXISTS public.sync_teacher_department();
DROP FUNCTION IF EXISTS public.sync_teacher_department_manual(UUID);
DROP FUNCTION IF EXISTS public.get_department_from_subject(UUID);
```

Note: This won't revert departments that were already updated.

## Related Files

- `supabase/migrations/20260309100000_auto_sync_teacher_department.sql` - Migration file
- `FRAMS/lib/subjectTeachers.ts` - Frontend assignment logic
- `FRAMS/screens/admin/AssignSubjects.tsx` - Admin UI for assignments
- `FRAMS/screens/ProfileScreen.tsx` - Profile display
- `FRAMS/hooks/useProfile.ts` - Profile data fetching

## Migration Status

- ✅ Migration file created
- ⏳ Needs to be applied to database
- ⏳ Needs verification after application

## Next Steps

1. Apply the migration using Supabase SQL Editor
2. Verify all teachers have proper departments
3. Test by assigning a teacher to a new subject
4. Check that department updates automatically
5. Verify Profile screen shows correct department
