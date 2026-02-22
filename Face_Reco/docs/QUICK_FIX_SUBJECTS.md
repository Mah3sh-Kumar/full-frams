# Quick Fix: Add Subjects via Supabase Dashboard

Since RLS policies are blocking programmatic inserts, here's the **easiest way** to add subjects:

## Method 1: Use Supabase Dashboard (Recommended - 2 minutes)

1. **Go to your Supabase project** → https://supabase.com/dashboard
2. **Click "Table Editor"** in the left sidebar
3. **Select "subjects" table**
4. **Click "Insert" → "Insert row"**

### Add these subjects for Class 10:

For each subject, click "Insert row" and fill in:

**Subject 1:**
- name: `Mathematics`
- code: `MATH101`
- class_id: `[Copy the UUID from classes table for Class 10]`

**Subject 2:**
- name: `Science`
- code: `SCI101`
- class_id: `[Same Class 10 UUID]`

**Subject 3:**
- name: `English`
- code: `ENG101`
- class_id: `[Same Class 10 UUID]`

**Subject 4:**
- name: `Social Studies`
- code: `SS101`
- class_id: `[Same Class 10 UUID]`

### How to get the Class 10 UUID:

1. In Table Editor, click "classes" table
2. Find "Class 10 (2025-2026)" row
3. Copy the `id` value (it's a long UUID like `abc123...`)
4. Use this ID when adding subjects

---

## Method 2: Disable RLS Temporarily (Advanced)

Run this in SQL Editor:

```sql
-- Disable RLS on subjects table
ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;

-- Now run the insert
INSERT INTO public.subjects (name, code, class_id)
SELECT 'Mathematics', 'MATH101', id FROM public.classes WHERE name = 'Class 10' AND academic_year = '2025-2026'
UNION ALL
SELECT 'Science', 'SCI101', id FROM public.classes WHERE name = 'Class 10' AND academic_year = '2025-2026'
UNION ALL
SELECT 'English', 'ENG101', id FROM public.classes WHERE name = 'Class 10' AND academic_year = '2025-2026'
UNION ALL
SELECT 'Social Studies', 'SS101', id FROM public.classes WHERE name = 'Class 10' AND academic_year = '2025-2026';

-- Re-enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT s.name, s.code, c.name as class_name 
FROM subjects s 
JOIN classes c ON c.id = s.class_id;
```

---

## After Adding Subjects

1. **Close the FRAMS app** (if running)
2. **Restart**: `python main.py`
3. **Click "Start Recognition"**
4. **Select Class 10** → You should now see the subjects!

---

## Quick Test

If you just want to test with ONE subject:
- Add just "Mathematics" for Class 10
- That's enough to test the recognition flow
