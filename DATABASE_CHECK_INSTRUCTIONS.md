# Database Check - Simple Instructions

## The Error You Got

The SQL script had an error in the referential constraints query. I've fixed it and created simpler scripts.

---

## What You Need to Do (5 Minutes)

### 1. Open Supabase Dashboard
- Go to https://supabase.com
- Sign in
- Select your project

### 2. Click SQL Editor
- Click "SQL Editor" in left sidebar
- Click "New Query"

### 3. Run This Query (Copy & Paste)

```sql
SELECT COUNT(*) as "Total Classes" FROM public.classes;
```

**Click the "Run" button**

### 4. Check the Result

**You should see one of these:**

**Option A - Data Exists ✅**
```
Total Classes
6
```

**Option B - No Data ❌**
```
Total Classes
0
```

---

## Step 5: Check Departments

Click "New Query" again and run:

```sql
SELECT COUNT(*) as "Total Departments" FROM public.org_departments;
```

**Click "Run"**

**You should see:**
- ✅ A number like `15` = Departments exist
- ❌ `0` = Departments table is empty

---

## Step 6: See All Data

To see what's in each table, run these queries one by one:

**See all classes:**
```sql
SELECT name, value, academic_year FROM public.classes ORDER BY display_order;
```

**See all departments:**
```sql
SELECT name, code FROM public.org_departments ORDER BY display_order;
```

**See all branches:**
```sql
SELECT name, code FROM public.branches ORDER BY display_order;
```

---

## If Tables Are Empty - Seed Data

### Add Classes:
```sql
INSERT INTO public.classes (name, value, academic_year, display_order, is_active, created_at, updated_at)
VALUES
  ('Class 9', 'class_9', '2025-2026', 1, true, NOW(), NOW()),
  ('Class 10', 'class_10', '2025-2026', 2, true, NOW(), NOW()),
  ('Class 11', 'class_11', '2025-2026', 3, true, NOW(), NOW()),
  ('Class 12', 'class_12', '2025-2026', 4, true, NOW(), NOW()),
  ('Graduation Year 1', 'grad_year_1', '2025-2026', 5, true, NOW(), NOW()),
  ('Graduation Year 2', 'grad_year_2', '2025-2026', 6, true, NOW(), NOW())
ON CONFLICT DO NOTHING;
```

### Add Departments:
```sql
INSERT INTO public.org_departments (name, code, display_order, is_active, created_at, updated_at)
VALUES
  ('Computer Science', 'cs', 1, true, NOW(), NOW()),
  ('Information Technology', 'it', 2, true, NOW(), NOW()),
  ('Electronics & Communication', 'ece', 3, true, NOW(), NOW()),
  ('Mechanical Engineering', 'me', 4, true, NOW(), NOW()),
  ('Civil Engineering', 'ce', 5, true, NOW(), NOW()),
  ('Electrical Engineering', 'ee', 6, true, NOW(), NOW()),
  ('Mathematics', 'math', 7, true, NOW(), NOW()),
  ('Physics', 'physics', 8, true, NOW(), NOW()),
  ('Chemistry', 'chemistry', 9, true, NOW(), NOW()),
  ('English', 'english', 10, true, NOW(), NOW()),
  ('History', 'history', 11, true, NOW(), NOW()),
  ('Geography', 'geography', 12, true, NOW(), NOW()),
  ('Biology', 'biology', 13, true, NOW(), NOW()),
  ('Commerce', 'commerce', 14, true, NOW(), NOW()),
  ('Economics', 'economics', 15, true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;
```

---

## After Seeding

1. Refresh the app (Ctrl+R)
2. Go to Teacher signup
3. Open browser console (F12)
4. Look for: `📊 Departments fetched: [...]`
5. Click Department dropdown
6. See all departments!

---

## Quick Reference

| What | Query | Expected |
|------|-------|----------|
| Count classes | `SELECT COUNT(*) FROM public.classes;` | 4+ |
| Count departments | `SELECT COUNT(*) FROM public.org_departments;` | 10+ |
| Count branches | `SELECT COUNT(*) FROM public.branches;` | 1+ |

---

## Files Created

1. **QUICK_DATABASE_CHECK.sql** - Simple queries
2. **DATABASE_VERIFICATION_SCRIPT_FIXED.sql** - Complete check
3. **DATABASE_CHECK_CORRECTED.md** - Detailed guide
4. **DATABASE_CHECK_INSTRUCTIONS.md** - This file

---

## Next Steps

1. Run the count queries above
2. Tell me the results
3. If 0, run the seeding scripts
4. Refresh the app and test!

