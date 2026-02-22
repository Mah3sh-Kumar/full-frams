# Migration Scripts

This directory contains scripts for migrating and managing data in the application.

## Organizational Data Migration

### Overview

The organizational data migration script populates the database with hardcoded data from `lib/constants.ts`:
- Class levels (8 records)
- Branches (11 records)  
- Departments (15 records)

### Prerequisites

1. Ensure the database schema migration has been applied (`supabase/migrations/003_organizational_data_schema.sql`)
2. Set up environment variables in `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Running the Migration

#### Using npm script (Recommended):

```bash
npm run migrate:org-data
```

#### Using node directly:

```bash
node scripts/migrate-organizational-data.js
```

### What the Script Does

1. **Migrates Classes**: Inserts 8 class levels from `CLASS_LEVELS` constant
2. **Migrates Branches**: Inserts 11 branches from `BRANCHES` constant
3. **Migrates Departments**: Inserts 15 departments from `DEPARTMENTS` constant
4. **Verifies Data**: Checks that all records were inserted correctly

### Output

The script provides detailed output showing:
- Progress for each record (✅ success or ❌ error)
- Count of migrated records
- Verification results
- Final summary

Example output:
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
  ...
Migrated 11/11 branches

🏢 Migrating departments...
  ✅ Computer Science
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

### Safe Re-runs

The script uses `upsert` operations, making it safe to re-run:
- Existing records will be updated
- New records will be inserted
- No duplicates will be created

### Troubleshooting

**Error: "Supabase credentials not found"**
- Solution: Check your `.env` file has the correct credentials

**Error: "relation 'org_classes' does not exist"**
- Solution: Run the schema migration first (`003_organizational_data_schema.sql`)

**Error: "Permission denied"**
- Solution: Ensure your Supabase user has the necessary permissions

### Files

- `migrate-organizational-data.js` - JavaScript version (runs with node)
- `migrate-organizational-data.ts` - TypeScript version (requires ts-node)

Both versions provide the same functionality. Use the JavaScript version for simplicity or the TypeScript version for type safety.

## Other Scripts

Additional migration and utility scripts can be added to this directory as needed.
