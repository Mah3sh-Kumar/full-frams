# 🚀 Quick Fix: Auto-Sync Teacher Department

## The Problem
Teachers show "Department: Not assigned" even after admin assigns them to subjects.

## ⚡ 2-Minute Database Fix

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard → Your Project → SQL Editor

### Step 2: Run This Migration
Copy and paste the entire contents of:
`supabase/migrations/20260309100000_auto_sync_teacher_department.sql`

Or run this quick version:

```sql
BEGIN;

-- Function to get department from subject
CREATE OR REPLACE FUNCTION public.get_department_from_subject(p_subject_id UUID)
RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE v_department_name TEXT;
BEGIN
  SELECT d.name INTO v_department_name
  FROM public.subjects s
  INNER JOIN public.classes c ON c.id = s.class_id
  INNER JOIN public.branches b ON b.id = c.branch_id
  INNER JOIN public.org_departments d ON d.id = b.department_id
  WHERE s.id = p_subject_id;
  RETURN v_department_name;
END; $$;

-- Trigger function to sync department
CREATE OR REPLACE FUNCTION public.sync_teacher_department()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_department_name TEXT;
  v_current_department TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT department INTO v_current_department
    FROM public.teachers WHERE id = NEW.teacher_id;
    
    IF v_current_department IS NULL 
       OR v_current_department = '' 
       OR v_current_department = 'Not assigned' THEN
      
      v_department_name := public.get_department_from_subject(NEW.subject_id);
      
      IF v_department_name IS NOT NULL THEN
        UPDATE public.teachers
        SET department = v_department_name
        WHERE id = NEW.teacher_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to sync teacher department: %', SQLERRM;
    RETURN NEW;
END; $$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_teacher_department ON public.subject_teachers;
CREATE TRIGGER trigger_sync_teacher_department
  AFTER INSERT ON public.subject_teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_teacher_department();

-- Temporarily disable update_updated_at trigger if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_teachers_updated_at' 
    AND tgrelid = 'public.teachers'::regclass
  ) THEN
    ALTER TABLE public.teachers DISABLE TRIGGER trigger_teachers_updated_at;
  END IF;
END $$;

-- Backfill existing teachers
DO $$
DECLARE
  v_teacher_record RECORD;
  v_department_name TEXT;
BEGIN
  FOR v_teacher_record IN
    SELECT DISTINCT t.id
    FROM public.teachers t
    INNER JOIN public.subject_teachers st ON st.teacher_id = t.id
    WHERE t.department IS NULL 
       OR t.department = '' 
       OR t.department = 'Not assigned'
  LOOP
    SELECT public.get_department_from_subject(st.subject_id) INTO v_department_name
    FROM public.subject_teachers st
    WHERE st.teacher_id = v_teacher_record.id
    LIMIT 1;
    
    IF v_department_name IS NOT NULL THEN
      UPDATE public.teachers
      SET department = v_department_name
      WHERE id = v_teacher_record.id;
    END IF;
  END LOOP;
END $$;

-- Re-enable the trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_teachers_updated_at' 
    AND tgrelid = 'public.teachers'::regclass
  ) THEN
    ALTER TABLE public.teachers ENABLE TRIGGER trigger_teachers_updated_at;
  END IF;
END $$;

COMMIT;
```

### Step 3: Verify It Worked

Run this to check:
```sql
SELECT 
  u.email,
  t.department,
  COUNT(st.subject_id) as subjects
FROM users u
INNER JOIN teachers t ON t.id = u.id
LEFT JOIN subject_teachers st ON st.teacher_id = u.id
WHERE u.role = 'teacher'
GROUP BY u.email, t.department;
```

All teachers with subject assignments should now have proper departments! ✅

## What This Does

### Automatic Sync
When admin assigns a teacher to a subject:
```
Admin assigns: Teacher → Subject (Data Structures)
                              ↓
                         Class (BSC CS 3rd Year)
                              ↓
                         Branch (Computer Science)
                              ↓
                         Department (Computer Science)
                              ↓
Trigger fires: UPDATE teachers SET department = 'Computer Science'
                              ↓
Profile shows: Department: Computer Science ✅
```

### Benefits
✅ **Automatic** - No manual updates needed  
✅ **Instant** - Updates immediately on assignment  
✅ **Backward Compatible** - Fixes existing teachers  
✅ **Safe** - Only updates "Not assigned" departments  
✅ **Future-Proof** - All new assignments auto-sync  

## Manual Sync (If Needed)

To manually sync a specific teacher:
```sql
SELECT public.sync_teacher_department_manual('teacher-uuid-here');
```

## Testing

1. **Check current state:**
   ```sql
   SELECT email, department FROM users u
   INNER JOIN teachers t ON t.id = u.id
   WHERE u.role = 'teacher';
   ```

2. **Assign teacher to a subject** (via admin panel)

3. **Verify department updated:**
   ```sql
   -- Should show actual department, not "Not assigned"
   SELECT email, department FROM users u
   INNER JOIN teachers t ON t.id = u.id
   WHERE u.role = 'teacher';
   ```

## Complete Documentation

For full details, see:
- `FRAMS/docs/AUTO_SYNC_TEACHER_DEPARTMENT.md`
- `supabase/migrations/20260309100000_auto_sync_teacher_department.sql`

---

**Run the migration and teacher departments will sync automatically!** 🎉
