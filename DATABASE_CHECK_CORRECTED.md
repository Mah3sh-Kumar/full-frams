# Database Check - Corrected Guide

## Simple 3-Step Verification

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com
2. Sign in to your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Run This Simple Query

Copy and paste **ONLY THIS** (one query at a time):

```sql
SELECT COUNT(*) as "Total Classes" FROM public.classes;
```

**Click "Run"**

**What you should see:**
- If you see a number like `4` or `6` → ✅ Classes exist!
- If you see `0` → ❌ Classes table is empty

---

### Step 3: Check Departments

Click "New Query" again and run:

```sql
SELECT COUNT(*) as "Total Departments" FROM public.org_departments;
```

**Click "Run"**

**What you should see:**
- If you see a number like `10` or `15` → ✅ Departments exist!
- If you see `0` → ❌ Departments table is empty

---

## See All Data

### To see all classes:
```sql
SELECT name, value, academic_year, is_active FROM public.classes ORDER BY display_order;
```

### To see all departments:
```sql
SELECT name, code, is_active FROM public.org_departments ORDER BY display_order;
```

### To see all branches:
```sql
SELECT name, code, is_active FROM public.branches ORDER BY display_order;
```

---

## If Tables Are Empty - Seed Data

### Seed Classes:
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

**Click "Run"** → You should see "Rows inserted: 6"

---

### Seed Departments:
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

**Click "Run"** → You should see "Rows inserted: 15"

---

## Summary

| Check | Query | Expected Result |
|-------|-------|-----------------|
| Classes Count | `SELECT COUNT(*) FROM public.classes;` | 4 or more |
| Departments Count | `SELECT COUNT(*) FROM public.org_departments;` | 10 or more |
| Branches Count | `SELECT COUNT(*) FROM public.branches;` | 1 or more |

---

## What Happens After Seeding

1. ✅ Refresh the app (Ctrl+R)
2. ✅ Go to Teacher signup
3. ✅ Check console logs (F12)
4. ✅ Look for: `📊 Departments fetched: [...]`
5. ✅ Click Department dropdown
6. ✅ See all departments with improved UI!

---

## Troubleshooting

**Error: "Table does not exist"**
- Check spelling: `public.classes` (not `org_classes`)
- Check spelling: `public.org_departments` (not `departments`)

**Error: "Permission denied"**
- Make sure you're using the correct Supabase project
- Check your API key permissions

**No data showing**
- Run the seeding scripts above
- Verify rows were inserted

---

## Files Available

- `QUICK_DATABASE_CHECK.sql` - Simple queries to run
- `DATABASE_VERIFICATION_SCRIPT_FIXED.sql` - Complete verification
- `DATABASE_CHECK_CORRECTED.md` - This guide

