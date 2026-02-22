# How to Apply Migration 003: Organizational Data Schema

## Quick Start

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project: https://app.supabase.com
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Click **New Query**
2. Open the file `supabase/migrations/003_organizational_data_schema.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

### Step 3: Verify the Migration
1. Click **New Query** again
2. Open the file `supabase/scripts/verify_organizational_schema.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run**
6. Review the verification results - all checks should show ✅ PASS

## What This Migration Creates

### Tables
- **org_classes**: Stores class levels (Class 9, Class 10, etc.)
- **org_branches**: Stores branches/streams (Computer Science, etc.)
- **org_departments**: Stores departments for teachers

### Security
- **RLS Policies**: Admin-only write access, all authenticated users can read
- **Constraints**: Unique constraints, foreign keys, NOT NULL constraints
- **Indexes**: Performance indexes on commonly queried columns

### Helper Functions
- `can_delete_class(class_value)`: Check if a class can be safely deleted
- `can_delete_branch(branch_name)`: Check if a branch can be safely deleted
- `can_delete_department(department_name)`: Check if a department can be safely deleted

### Seed Data
- 8 class levels (Class 9 through Graduation Year 4)
- 11 branches (Computer Science, IT, Engineering streams, etc.)
- 15 departments (Computer Science, Mathematics, Physics, etc.)

## Expected Results

After running the migration, you should see:
- ✅ 3 new tables created
- ✅ 9+ indexes created
- ✅ 15+ RLS policies created
- ✅ 3 helper functions created
- ✅ 34 seed records inserted (8 classes + 11 branches + 15 departments)

## Troubleshooting

### Error: "relation already exists"
The migration includes `DROP TABLE IF EXISTS` statements, so this shouldn't happen. If it does, the tables already exist and you can skip this migration.

### Error: "function is_admin() does not exist"
You need to run migration `001_enhanced_admin_rls_policies.sql` first, as it creates the `is_admin()` helper function.

### Error: "permission denied"
Make sure you're running the migration as a database admin or the postgres user.

## Next Steps

After successfully applying this migration:

1. **Implement OrganizationService** (Task 6)
   - Create service layer for CRUD operations
   - Add validation logic
   - Implement dependency checking

2. **Create Admin UI** (Task 7)
   - Build OrganizationManager screen
   - Add forms for creating/editing/deleting items
   - Implement confirmation dialogs

3. **Update Forms** (Task 9)
   - Update SignUpScreen to use database-driven dropdowns
   - Update UserManagement to use database-driven dropdowns
   - Implement branch filtering based on class selection

## Rollback

If you need to rollback this migration:

```sql
-- Drop tables
DROP TABLE IF EXISTS public.org_branches CASCADE;
DROP TABLE IF EXISTS public.org_classes CASCADE;
DROP TABLE IF EXISTS public.org_departments CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.can_delete_class(TEXT);
DROP FUNCTION IF EXISTS public.can_delete_branch(TEXT);
DROP FUNCTION IF EXISTS public.can_delete_department(TEXT);
DROP FUNCTION IF EXISTS public.update_updated_at_column();
```

## Support

If you encounter any issues:
1. Check the verification script output for specific errors
2. Review the Supabase logs in the Dashboard
3. Ensure all previous migrations have been applied
4. Check that you have admin privileges on the database
