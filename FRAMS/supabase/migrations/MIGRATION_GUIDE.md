# Organizational Data Migration Guide

This guide explains how to migrate hardcoded organizational data from `lib/constants.ts` to the database.

## Overview

The migration process moves the following data from constants to database tables:
- **CLASS_LEVELS** → `org_classes` table (8 records)
- **BRANCHES** → `org_branches` table (11 records)
- **DEPARTMENTS** → `org_departments` table (15 records)

## Prerequisites

1. Ensure migration `003_organizational_data_schema.sql` has been applied
2. Have admin access to your Supabase project
3. For TypeScript migration: Have Node.js and npm installed

## Migration Methods

### Method 1: SQL Migration (Recommended for Production)

This method uses SQL scripts directly in Supabase.

#### Step 1: Apply the Migration

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/004_populate_organizational_data.sql`
4. Copy and paste the entire content
5. Click **Run** to execute

The script will:
- Insert all class levels, branches, and departments
- Use `ON CONFLICT` to safely handle re-runs
- Display a summary of migrated records

#### Step 2: Verify the Migration

1. In the SQL Editor, open `supabase/scripts/verify_organizational_data.sql`
2. Copy and paste the entire content
3. Click **Run** to execute

The verification script will check:
- ✅ Table existence
- ✅ Data counts (8 classes, 11 branches, 15 departments)
- ✅ Specific records from constants
- ✅ Data integrity (no duplicates, no NULL values)
- ✅ Indexes and RLS policies

### Method 2: TypeScript Migration (For Development)

This method uses a TypeScript script that can be run from your development environment.

#### Step 1: Run the Migration Script

```bash
npx ts-node scripts/migrate-organizational-data.ts
```

The script will:
- Connect to your Supabase instance using the configured client
- Migrate each type of organizational data
- Display progress for each record
- Verify data counts after migration
- Exit with code 0 on success, 1 on failure

#### Step 2: Review the Output

The script provides detailed output:

```
============================================================
🚀 Starting Organizational Data Migration
============================================================

📚 Migrating class levels...
  ✅ Class 9
  ✅ Class 10
  ...

Migrated 8/8 class levels

🌿 Migrating branches...
  ✅ Computer Science
  ✅ Information Technology
  ...

Migrated 11/11 branches

🏢 Migrating departments...
  ✅ Computer Science
  ✅ Information Technology
  ...

Migrated 15/15 departments

🔍 Verifying migration...

📊 Data counts:
  Classes: 8 (expected: 8)
  Branches: 11 (expected: 11)
  Departments: 15 (expected: 15)

============================================================
📋 Migration Summary
============================================================
✅ Migration completed successfully!

Details:
  Classes migrated: 8/8
  Branches migrated: 11/11
  Departments migrated: 15/15
============================================================
```

## Verification Checklist

After running the migration, verify the following:

### 1. Data Counts
- [ ] 8 class levels in `org_classes`
- [ ] 11 branches in `org_branches`
- [ ] 15 departments in `org_departments`

### 2. Specific Records

**Classes:**
- [ ] Class 9, Class 10, Class 11, Class 12
- [ ] Graduation Year 1, 2, 3, 4

**Branches:**
- [ ] Computer Science, Information Technology
- [ ] Electronics & Communication
- [ ] Mechanical Engineering, Civil Engineering, Electrical Engineering
- [ ] BBA, BCA, B.Com, B.Sc, Other

**Departments:**
- [ ] Computer Science, Information Technology, Electronics
- [ ] Electrical Engineering, Mechanical Engineering, Civil Engineering
- [ ] Mathematics, Physics, Chemistry, Biology
- [ ] English, History, Commerce, Economics, Other

### 3. Data Integrity
- [ ] No duplicate records
- [ ] All records have `is_active = true`
- [ ] All records have proper `display_order`
- [ ] No NULL values in required fields

### 4. Database Features
- [ ] RLS policies are enabled on all tables
- [ ] Indexes exist for performance
- [ ] Updated_at triggers are working

## Troubleshooting

### Issue: "Table does not exist"

**Solution:** Run migration `003_organizational_data_schema.sql` first to create the tables.

### Issue: "Duplicate key violation"

**Solution:** This is expected if you're re-running the migration. The `ON CONFLICT` clause will update existing records instead of creating duplicates.

### Issue: "Permission denied"

**Solution:** Ensure you're running the migration as a user with admin privileges. Check RLS policies.

### Issue: TypeScript migration fails with connection error

**Solution:** 
1. Check your `.env` file has correct Supabase credentials
2. Ensure `lib/supabase.ts` is properly configured
3. Verify network connectivity to Supabase

## Re-running the Migration

Both migration methods are safe to re-run:

- **SQL Migration:** Uses `ON CONFLICT DO UPDATE` to update existing records
- **TypeScript Migration:** Uses `upsert` with `onConflict` to handle duplicates

Re-running will:
- Update existing records with current values from constants
- Add any new records that don't exist
- Preserve record IDs and timestamps

## Next Steps

After successful migration:

1. ✅ Update application code to fetch data from database instead of constants
2. ✅ Test forms with database-driven dropdowns
3. ✅ Implement admin UI for managing organizational data
4. ✅ Consider deprecating hardcoded constants in `lib/constants.ts`

## Rollback

If you need to rollback the migration:

```sql
-- Remove all migrated data
DELETE FROM public.org_classes;
DELETE FROM public.org_branches;
DELETE FROM public.org_departments;

-- Or drop the tables entirely (requires re-running migration 003)
DROP TABLE IF EXISTS public.org_branches CASCADE;
DROP TABLE IF EXISTS public.org_classes CASCADE;
DROP TABLE IF EXISTS public.org_departments CASCADE;
```

## Support

If you encounter issues:
1. Check the verification script output for specific errors
2. Review Supabase logs in the Dashboard
3. Ensure all prerequisites are met
4. Verify database permissions and RLS policies
