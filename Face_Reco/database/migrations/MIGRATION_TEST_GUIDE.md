# Migration Script Testing Guide

## Overview

This guide explains how to test the `populate_missing_data.py` migration script in a test environment before running it in production.

**Requirements Tested**: 2.3, 2.4, 2.5

## Test Files

### 1. `tests/test_migration_script.py`
Comprehensive test suite that validates:
- Academic year 2025-2026 creation
- Subject population for all classes
- Data integrity validation
- Idempotency (safe to run multiple times)
- Academic year reference validation
- Subject data structure validation

### 2. `tests/test_migration_post_execution.py`
Post-migration validation that checks:
- Academic year 2025-2026 exists
- All classes have subjects
- No invalid academic year references
- No duplicate academic years
- Correct is_current flag setting

## Row-Level Security (RLS) Issue

### Problem
The migration script requires INSERT permissions on the `academic_years` and `subjects` tables. When run with the standard SUPABASE_KEY (anon key), it will fail with:

```
Error: new row violates row-level security policy for table "academic_years"
Error: new row violates row-level security policy for table "subjects"
```

### Solutions

#### Option 1: Use Service Role Key (Recommended for Testing)
1. Create a test environment `.env` file with service role credentials:
   ```bash
   cp .env .env.test
   ```

2. Update `.env.test` with service role key:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_service_role_key  # NOT the anon key
   ```

3. Run migration with test environment:
   ```bash
   # Load test environment
   export $(cat .env.test | xargs)
   
   # Run migration
   python -m database.migrations.populate_missing_data
   ```

#### Option 2: Temporarily Disable RLS (Not Recommended)
Only use this in a dedicated test database, never in production:

1. Connect to Supabase SQL Editor
2. Disable RLS temporarily:
   ```sql
   ALTER TABLE academic_years DISABLE ROW LEVEL SECURITY;
   ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
   ```

3. Run migration:
   ```bash
   python -m database.migrations.populate_missing_data
   ```

4. Re-enable RLS:
   ```sql
   ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
   ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
   ```

#### Option 3: Add RLS Policy for Migration (Recommended for Production)
Create a policy that allows authenticated admins to insert data:

```sql
-- Policy for academic_years
CREATE POLICY "Allow admin insert on academic_years"
ON academic_years
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_verified = true
  )
);

-- Policy for subjects
CREATE POLICY "Allow admin insert on subjects"
ON subjects
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
    AND users.is_verified = true
  )
);
```

Then authenticate as an admin before running the migration.

## Testing Workflow

### Step 1: Pre-Migration State Check
Run the post-migration validation to see current state:

```bash
cd Face_Reco
python tests/test_migration_post_execution.py
```

Expected output: Tests should FAIL showing missing data.

### Step 2: Run Migration Script
Choose one of the RLS solutions above and run:

```bash
python -m database.migrations.populate_missing_data
```

Expected output:
```
============================================================
Database Migration: Populate Missing Data
============================================================
Checking academic years...
Adding academic year 2025-2026...
✓ Academic year 2025-2026 added successfully

Checking subjects for all classes...
  ✓ F.Y. B.Sc.: Added 5 subjects
  ✓ S.Y. B.Sc.: Added 5 subjects
  ... (more classes)

Summary: 17 classes updated, 0 classes skipped

Validating data integrity...
✓ All data integrity checks passed

============================================================
✓ Migration completed successfully
============================================================
```

### Step 3: Post-Migration Validation
Run the validation again to confirm success:

```bash
python tests/test_migration_post_execution.py
```

Expected output: All tests should PASS.

### Step 4: Test Idempotency
Run the migration again to verify it's safe to run multiple times:

```bash
python -m database.migrations.populate_missing_data
```

Expected output:
```
✓ Academic year 2025-2026 already exists
  ✓ F.Y. B.Sc.: Already has 5 subjects
  ... (all classes skipped)

Summary: 0 classes updated, 17 classes skipped
✓ All data integrity checks passed
✓ Migration completed successfully
```

### Step 5: Run Full Test Suite
Run the comprehensive test suite:

```bash
python tests/test_migration_script.py
```

Expected output: All 6 tests should PASS.

## Test Results Interpretation

### All Tests Pass ✓
- Migration was successful
- Academic year 2025-2026 exists
- All classes have subjects
- Data integrity is maintained
- Safe to run in production

### Some Tests Fail ✗
Check which tests failed:

1. **Academic year 2025-2026 not found**
   - Migration didn't run or failed
   - Check RLS permissions
   - Review migration logs

2. **Classes without subjects**
   - Subject population failed
   - Check RLS permissions on subjects table
   - Verify class_id references are valid

3. **Invalid academic year references**
   - Academic year creation failed
   - Some classes reference non-existent years
   - Run migration again

4. **Idempotency test fails**
   - Migration creates duplicates
   - Check for logic errors in migration script
   - Review database constraints

## Rollback Procedure

If migration fails or creates incorrect data:

### Rollback Academic Years
```sql
DELETE FROM academic_years WHERE name = '2025-2026';
UPDATE academic_years SET is_current = true WHERE name = '2024-2025';
```

### Rollback Subjects
```sql
-- Get list of subject IDs created by migration
SELECT id, name, class_id FROM subjects 
WHERE created_at > 'MIGRATION_START_TIME';

-- Delete subjects created by migration
DELETE FROM subjects WHERE created_at > 'MIGRATION_START_TIME';
```

### Full Rollback Script
Create a backup before migration:

```bash
# Backup academic years
python -c "
from database.client import SupabaseClient
import json
db = SupabaseClient()
ay = db.client.table('academic_years').select('*').execute()
with open('backup_academic_years.json', 'w') as f:
    json.dump(ay.data, f, indent=2)
"

# Backup subjects
python -c "
from database.client import SupabaseClient
import json
db = SupabaseClient()
subj = db.client.table('subjects').select('*').execute()
with open('backup_subjects.json', 'w') as f:
    json.dump(subj.data, f, indent=2)
"
```

## Production Deployment Checklist

Before running in production:

- [ ] All tests pass in test environment
- [ ] Migration script tested with service role key
- [ ] Idempotency verified (can run multiple times safely)
- [ ] Rollback procedure documented and tested
- [ ] Database backup created
- [ ] RLS policies reviewed and configured
- [ ] Admin authentication configured (if using Option 3)
- [ ] Migration logs reviewed for errors
- [ ] Post-migration validation tests pass
- [ ] Stakeholders notified of maintenance window

## Troubleshooting

### Error: "new row violates row-level security policy"
**Cause**: Using anon key instead of service role key, or missing RLS policies.
**Solution**: Use service role key or add RLS policies (see Options above).

### Error: "Class with ID X not found"
**Cause**: Invalid class_id in migration script.
**Solution**: Verify class IDs exist in database before running migration.

### Error: "Duplicate key value violates unique constraint"
**Cause**: Academic year or subject already exists.
**Solution**: This is expected behavior - migration is idempotent. Check logs to confirm.

### Warning: "No template found, using default subjects"
**Cause**: Class name doesn't match any template (e.g., LL.B. classes).
**Solution**: This is expected. Default subjects will be used. Review and update manually if needed.

## Summary

The migration script testing workflow ensures:
1. ✓ Academic year 2025-2026 is created correctly
2. ✓ Subjects are created for all classes
3. ✓ Data integrity validation passes
4. ✓ Migration is idempotent (safe to run multiple times)
5. ✓ Rollback procedure is available if needed

**Requirements Validated**: 2.3, 2.4, 2.5
