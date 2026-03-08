# Quick Fix for Student 2

## Current Status
- **Email:** mk94854541@gmail.com
- **Name:** Student 2
- **Status:** Verified ✓
- **Problem:** All student fields are NULL (enrollment_number, class_id, branch_id, department_id)

## Option 1: Fix via SQL (Recommended)

Choose a branch and class for the student, then run this SQL:

### Example: Assign to B.Com First Year

```sql
UPDATE students 
SET 
    enrollment_number = 'STU002',  -- Change this to actual enrollment number
    branch_id = '7d93852b-1cc4-4ce3-95d3-0ff9353d1cbe',  -- B.Com
    class_id = '06869fb7-dad3-4a43-9462-09e328d38323'    -- F.Y. B.Com
WHERE id = '8747f587-bc18-4a58-af39-c719d8e8bf94';
```

The `department_id` will be automatically set to "Commerce" by the database trigger.

### Example: Assign to Information Technology First Year

```sql
UPDATE students 
SET 
    enrollment_number = 'STU002',  -- Change this to actual enrollment number
    branch_id = '917f7654-511f-450d-a653-57e678ceab48',  -- Information Technology
    class_id = '6d51de5a-b7e2-4cb5-855d-71f24bd8c9be'    -- F.Y. B.Sc. (IT)
WHERE id = '8747f587-bc18-4a58-af39-c719d8e8bf94';
```

The `department_id` will be automatically set to "Science & Technology" by the database trigger.

## Option 2: Delete and Re-register

If you prefer, you can delete this student and have them sign up again with the new flow:

```sql
-- Delete from students table (will cascade to related records)
DELETE FROM students WHERE id = '8747f587-bc18-4a58-af39-c719d8e8bf94';

-- Delete from users table
DELETE FROM users WHERE id = '8747f587-bc18-4a58-af39-c719d8e8bf94';

-- Delete from auth.users (Supabase Auth)
-- This needs to be done via Supabase Dashboard or Admin API
```

Then have the student sign up again using the new improved signup flow.

## Available Branches

| Branch Name | Department | Branch ID |
|------------|-----------|-----------|
| B.Com | Commerce | 7d93852b-1cc4-4ce3-95d3-0ff9353d1cbe |
| Information Technology | Science & Technology | 917f7654-511f-450d-a653-57e678ceab48 |
| Computer Science | Science & Technology | 3c9c6aae-0de2-4954-bba5-c51108c7c8ef |
| LL.B. | Law | aaafaecb-182f-42b6-95af-2926906018e6 |
| BMS | Commerce | ec7b9313-4525-4659-a7c5-4a1c75c93645 |
| History | Arts | 0755c324-7559-4fee-85f0-21f6460bb94d |

## Verify the Fix

After running the UPDATE, verify with:

```sql
SELECT 
    s.id,
    u.email,
    u.full_name,
    s.enrollment_number,
    c.name as class_name,
    b.name as branch_name,
    d.name as department_name
FROM students s
JOIN users u ON s.id = u.id
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN branches b ON s.branch_id = b.id
LEFT JOIN org_departments d ON s.department_id = d.id
WHERE u.email = 'mk94854541@gmail.com';
```

You should see all fields properly populated!
