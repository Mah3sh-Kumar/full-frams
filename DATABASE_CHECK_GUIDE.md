# Database Verification Guide - Classes & Departments

## Quick Check Instructions

### Method 1: Using Supabase Dashboard (Easiest)

**Step 1: Open Supabase Dashboard**
1. Go to https://supabase.com
2. Sign in to your account
3. Select your project

**Step 2: Check Classes Table**
1. Click on "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy and paste this query:

```sql
SELECT 
  id,
  name,
  value,
  academic_year,
  display_order,
  is_active,
  created_at
FROM public.classes
ORDER BY display_order ASC;
```

4. Click "Run" button
5. Check the results

**Expected Result:**
```
id                                   | name      | value     | academic_year | display_order | is_active | created_at
-------------------------------------|-----------|-----------|---------------|---------------|-----------|----------
550e8400-e29b-41d4-a716-446655440000 | Class 9   | class_9   | 2025-2026     | 1             | true      | 2026-02-25
550e8400-e29b-41d4-a716-446655440001 | Class 10  | class_10  | 2025-2026     | 2             | true      | 2026-02-25
550e8400-e29b-41d4-a716-446655440002 | Class 11  | class_11  | 2025-2026     | 3             | true      | 2026-02-25
550e8400-e29b-41d4-a716-446655440003 | Class 12  | class_12  | 2025-2026     | 4             | true      | 2026-02-25
```

**If you see data:** ✅ Classes table is populated!

**If you see empty result:** ❌ Need to seed classes. Go to "Seeding Data" section.

---

**Step 3: Check Departments Table**
1. Click "New Query" again
2. Copy and paste this query:

```sql
SELECT 
  id,
  name,
  code,
  display_order,
  is_active,
  created_at
FROM public.org_departments
ORDER BY display_order ASC;
```

3. Click "Run" button
4. Check the results

**Expected Result:**
```
id                                   | name                      | code | display_order | is_active | created_at
-------------------------------------|---------------------------|------|---------------|-----------|----------
550e8400-e29b-41d4-a716-446655440010 | Computer Science          | cs   | 1             | true      | 2026-02-25
550e8400-e29b-41d4-a716-446655440011 | Information Technology    | it   | 2             | true      | 2026-02-25
550e8400-e29b-41d4-a716-446655440012 | Electronics & Communication | ece | 3             | true      | 2026-02-25
550e8400-e29b-41d4-a716-446655440013 | Mechanical Engineering    | me   | 4             | true      | 2026-02-25
```

**If you see data:** ✅ Departments table is populated!

**If you see empty result:** ❌ Need to seed departments. Go to "Seeding Data" section.

---

### Method 2: Using Browser Console (Alternative)

**Step 1: Open Browser Console**
1. Press F12 to open Developer Tools
2. Go to "Console" tab

**Step 2: Run Query**
3. Copy and paste this code:

```javascript
// Check classes
const classesResponse = await fetch('https://YOUR_SUPABASE_URL/rest/v1/classes?select=*', {
  headers: {
    'apikey': 'YOUR_SUPABASE_ANON_KEY',
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
  }
});
const classes = await classesResponse.json();
console.log('Classes:', classes);

// Check departments
const deptResponse = await fetch('https://YOUR_SUPABASE_URL/rest/v1/org_departments?select=*', {
  headers: {
    'apikey': 'YOUR_SUPABASE_ANON_KEY',
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
  }
});
const departments = await deptResponse.json();
console.log('Departments:', departments);
```

**Note:** Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual values.

---

## Seeding Data

### If Classes Table is Empty

**Step 1: Open SQL Editor**
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Click "New Query"

**Step 2: Run Seeding Script**
4. Copy and paste this SQL:

```sql
-- Insert classes if they don't exist
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

5. Click "Run" button
6. You should see: "Rows inserted: 6" (or however many were new)

---

### If Departments Table is Empty

**Step 1: Open SQL Editor**
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Click "New Query"

**Step 2: Run Seeding Script**
4. Copy and paste this SQL:

```sql
-- Insert departments if they don't exist
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

5. Click "Run" button
6. You should see: "Rows inserted: 15" (or however many were new)

---

## Complete Verification Script

If you want to check everything at once, use this comprehensive script:

```sql
-- ============================================================================
-- COMPLETE DATABASE VERIFICATION
-- ============================================================================

-- 1. Check Classes Table
SELECT 
  'CLASSES' as section,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_rows
FROM public.classes;

-- 2. Show Classes
SELECT 
  'Classes:' as info,
  id,
  name,
  value,
  academic_year,
  is_active
FROM public.classes
ORDER BY display_order ASC;

-- 3. Check Departments Table
SELECT 
  'DEPARTMENTS' as section,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_rows
FROM public.org_departments;

-- 4. Show Departments
SELECT 
  'Departments:' as info,
  id,
  name,
  code,
  is_active
FROM public.org_departments
ORDER BY display_order ASC;

-- 5. Summary
SELECT 
  'SUMMARY' as section,
  (SELECT COUNT(*) FROM public.classes) as total_classes,
  (SELECT COUNT(*) FROM public.org_departments) as total_departments,
  (SELECT COUNT(*) FROM public.branches) as total_branches;
```

---

## Troubleshooting

### Issue 1: "Table does not exist"

**Cause:** Table name is incorrect or table hasn't been created

**Solution:**
1. Check table name spelling (case-sensitive)
2. Verify table was created by migration
3. Check if you're in the correct schema (should be `public`)

---

### Issue 2: "Permission denied"

**Cause:** Your Supabase role doesn't have permission

**Solution:**
1. Use a role with higher permissions
2. Check RLS (Row Level Security) policies
3. Verify your API key has correct permissions

---

### Issue 3: "No rows returned"

**Cause:** Table exists but is empty

**Solution:**
1. Run the seeding script from "Seeding Data" section
2. Verify data was inserted
3. Refresh the app

---

## Expected Database State

### Classes Table Should Have:
- ✅ At least 4 classes (Class 9, 10, 11, 12)
- ✅ Graduation year classes (optional)
- ✅ `is_active = true` for all
- ✅ Unique `value` field (class_9, class_10, etc.)
- ✅ `academic_year` field populated

### Departments Table Should Have:
- ✅ At least 10 departments
- ✅ `is_active = true` for all
- ✅ Unique `code` field (cs, it, ece, etc.)
- ✅ `display_order` field populated

### Branches Table Should Have:
- ✅ Branches associated with classes
- ✅ `is_active = true` for all
- ✅ Unique `code` field
- ✅ `class_id` foreign key populated

---

## Quick Checklist

- [ ] Classes table has data (at least 4 rows)
- [ ] Departments table has data (at least 10 rows)
- [ ] Branches table has data (optional but recommended)
- [ ] All rows have `is_active = true`
- [ ] No NULL values in required fields
- [ ] `display_order` is sequential
- [ ] `created_at` timestamps are present

---

## Next Steps

1. **Run the verification queries** from Method 1
2. **Check the results** - Do you see data?
3. **If empty:** Run the seeding scripts
4. **If populated:** Refresh the app and test the dropdowns
5. **Verify:** Check console logs for "Departments fetched: [...]"

---

## Support

If you need help:
1. Share the query results from Step 2 or Step 3
2. Let me know if you see data or empty results
3. I can help you seed the data if needed

