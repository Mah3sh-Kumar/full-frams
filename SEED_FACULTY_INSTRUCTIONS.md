# Seed Faculty Structure - Instructions

## What This Does

This script adds your actual faculty structure to the database:

### Departments (Faculties):
- ✅ Science
- ✅ Commerce
- ✅ Arts
- ✅ Law

### Classes:
- ✅ Science: F.Y. B.Sc., S.Y. B.Sc., T.Y. B.Sc.
- ✅ Commerce: F.Y./S.Y./T.Y. B.Com, F.Y./S.Y./T.Y. BMS
- ✅ Arts: F.Y./S.Y./T.Y. B.A.
- ✅ Law: 1st to 5th Year LL.B.

### Branches:
- ✅ Science: Physics, Chemistry, CS, IT, Biotech
- ✅ Commerce: B.Com, BMS, BAF, BBI
- ✅ Arts: History, Economics, Psychology, Languages
- ✅ Law: (No branches - specializations can be added later)

---

## How to Use

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com
2. Sign in to your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

### Step 2: Copy the Script
1. Open file: `SEED_FACULTY_STRUCTURE.sql`
2. Copy ALL the content

### Step 3: Paste and Run
1. Paste into Supabase SQL Editor
2. Click "Run" button
3. Wait for completion

### Step 4: Check Results
You should see output like:

```
DEPARTMENTS ADDED
Science | science_dept | true
Commerce | commerce_dept | true
Arts | arts_dept | true
Law | law_dept | true

CLASSES ADDED
F.Y. B.Sc. | fy_bsc | true
S.Y. B.Sc. | sy_bsc | true
T.Y. B.Sc. | ty_bsc | true
... (and more)

BRANCHES ADDED
Physics | physics_branch | true
Chemistry | chemistry_branch | true
... (and more)

SUMMARY
total_departments: 4
total_classes: 17
total_branches: 40+
```

---

## After Seeding

### Step 1: Refresh the App
- Press Ctrl+R (or Cmd+R on Mac)

### Step 2: Test Student Signup
1. Go to Student signup
2. Click "Class Level" dropdown
3. Should see all 17 classes!
4. Select a class
5. Click "Branch" dropdown
6. Should see branches for that class!

### Step 3: Test Teacher Signup
1. Go to Teacher signup
2. Click "Department" dropdown
3. Should see all 4 departments!
4. Select a department

### Step 4: Check Console
1. Press F12 to open console
2. Look for: `📊 Departments fetched: [...]`
3. Should show all 4 departments

---

## Database Structure After Seeding

### Departments Table:
```
id | name | code | display_order | is_active
---|------|------|---------------|----------
1  | Science | science_dept | 1 | true
2  | Commerce | commerce_dept | 2 | true
3  | Arts | arts_dept | 3 | true
4  | Law | law_dept | 4 | true
```

### Classes Table:
```
id | name | value | academic_year | display_order | is_active
---|------|-------|---------------|---------------|----------
1  | F.Y. B.Sc. | fy_bsc | 2025-2026 | 1 | true
2  | S.Y. B.Sc. | sy_bsc | 2025-2026 | 2 | true
3  | T.Y. B.Sc. | ty_bsc | 2025-2026 | 3 | true
4  | F.Y. B.Com | fy_bcom | 2025-2026 | 4 | true
... (and more)
```

### Branches Table:
```
id | name | code | class_id | display_order | is_active
---|------|------|----------|---------------|----------
1  | Physics | physics_branch | (fy_bsc_id) | 1 | true
2  | Chemistry | chemistry_branch | (fy_bsc_id) | 2 | true
3  | Computer Science | cs_branch | (fy_bsc_id) | 3 | true
... (and more)
```

---

## Verification Queries

After seeding, you can verify with these queries:

### Count Everything:
```sql
SELECT 
  (SELECT COUNT(*) FROM public.org_departments) as departments,
  (SELECT COUNT(*) FROM public.classes) as classes,
  (SELECT COUNT(*) FROM public.branches) as branches;
```

### See All Departments:
```sql
SELECT name, code FROM public.org_departments ORDER BY display_order;
```

### See All Classes:
```sql
SELECT name, value FROM public.classes ORDER BY display_order;
```

### See All Branches:
```sql
SELECT name, code FROM public.branches ORDER BY display_order;
```

### See Branches for a Specific Class:
```sql
SELECT b.name, b.code 
FROM public.branches b
JOIN public.classes c ON b.class_id = c.id
WHERE c.value = 'fy_bsc'
ORDER BY b.display_order;
```

---

## Troubleshooting

### Issue: "Rows inserted: 0"
**Cause:** Data already exists (ON CONFLICT DO NOTHING prevents duplicates)
**Solution:** This is fine! Data is already in the database.

### Issue: "Permission denied"
**Cause:** Your Supabase role doesn't have permission
**Solution:** Use a role with higher permissions (service_role or admin)

### Issue: Dropdowns still empty after seeding
**Cause:** Browser cache not cleared
**Solution:** Hard refresh (Ctrl+Shift+R) or clear cache

### Issue: Branches not showing for selected class
**Cause:** Branches not linked to classes properly
**Solution:** Run the verification query to check class_id values

---

## Expected Results

After seeding and refreshing:

### Student Signup:
- ✅ Class Level dropdown shows 17 classes
- ✅ Selecting a class shows relevant branches
- ✅ Science classes show: Physics, Chemistry, CS, IT, Biotech
- ✅ Commerce classes show: B.Com, BMS, BAF, BBI
- ✅ Arts classes show: History, Economics, Psychology, Languages

### Teacher Signup:
- ✅ Department dropdown shows 4 departments
- ✅ Can select: Science, Commerce, Arts, or Law

### Console:
- ✅ `📊 Departments fetched: [...]` shows all 4 departments
- ✅ No errors in console

---

## Next Steps

1. **Run the seeding script** in Supabase SQL Editor
2. **Refresh the app** (Ctrl+R)
3. **Test the dropdowns** in signup screens
4. **Verify console logs** (F12)
5. **Create test users** to verify everything works

---

## Summary

| Item | Before | After |
|------|--------|-------|
| Departments | 1 | 4 |
| Classes | 1 | 17 |
| Branches | 1 | 40+ |
| Dropdown Experience | Limited | Full |
| Faculty Coverage | Minimal | Complete |

**Ready to seed?** Copy the script and run it in Supabase!

