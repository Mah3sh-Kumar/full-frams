# Database Migrations

This directory contains SQL migration files for the Smart Attendance System database schema.

## Migration Files

### 001_enhanced_admin_rls_policies.sql
- Adds admin audit logging
- Implements role change protection
- Adds bulk operation functions
- Creates admin statistics functions

### 002_admin_password_reset.sql
- Implements password reset functionality for admins

### 003_organizational_data_schema.sql
- Creates organizational data tables (classes, branches, departments)
- Implements admin-only write access via RLS policies
- Adds performance indexes
- Includes seed data from existing constants
- Provides dependency checking functions

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of the migration file you want to apply
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to the project root
cd /path/to/your/project

# Apply all pending migrations
supabase db push

# Or apply a specific migration
supabase db execute --file supabase/migrations/003_organizational_data_schema.sql
```

## Migration Order

Migrations should be applied in numerical order:
1. First: `001_enhanced_admin_rls_policies.sql`
2. Second: `002_admin_password_reset.sql`
3. Third: `003_organizational_data_schema.sql`

## Verifying Migrations

After applying a migration, you can verify it was successful by:

1. Checking the **Table Editor** in Supabase Dashboard
2. Running verification queries in the SQL Editor:

```sql
-- Verify organizational tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('org_classes', 'org_branches', 'org_departments');

-- Verify seed data was inserted
SELECT COUNT(*) FROM public.org_classes;
SELECT COUNT(*) FROM public.org_branches;
SELECT COUNT(*) FROM public.org_departments;

-- Verify RLS policies are enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('org_classes', 'org_branches', 'org_departments');
```

## Rolling Back Migrations

If you need to roll back the organizational data migration:

```sql
-- Drop the organizational tables
DROP TABLE IF EXISTS public.org_branches CASCADE;
DROP TABLE IF EXISTS public.org_classes CASCADE;
DROP TABLE IF EXISTS public.org_departments CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS public.can_delete_class(TEXT);
DROP FUNCTION IF EXISTS public.can_delete_branch(TEXT);
DROP FUNCTION IF EXISTS public.can_delete_department(TEXT);
DROP FUNCTION IF EXISTS public.update_updated_at_column();
```

## Notes

- Always backup your database before applying migrations
- Test migrations in a development environment first
- The organizational data tables are separate from the existing `classes` table to maintain backward compatibility
- RLS policies ensure only admins can modify organizational data
- All authenticated users can read active organizational data
