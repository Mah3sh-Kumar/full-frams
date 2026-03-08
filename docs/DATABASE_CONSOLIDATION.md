# Database Consolidation Summary

## Overview

All database migrations have been consolidated into a single, comprehensive schema file for easier management and deployment.

## Consolidated Files

### Main Schema File
- **Location**: `supabase/complete_database.sql`
- **Purpose**: Complete database schema including all tables, functions, triggers, and policies
- **Usage**: Run this file for new database deployments

### What's Included

The consolidated schema includes:

1. **Academic Years Table**
   - Unique academic year management
   - Date range validation
   - Current year tracking

2. **Subjects Table**
   - Subject management with soft delete
   - Academic year scoping
   - Comprehensive audit trails
   - Active/inactive status

3. **Subject-Teachers Junction Table**
   - Many-to-many relationships between subjects and teachers
   - Primary teacher designation
   - Assignment audit metadata

4. **Assignment Attachments**
   - File upload support (PDF, Word documents)
   - Storage bucket configuration
   - Row-level security policies for file access

5. **Stored Procedures**
   - `create_subject_with_teachers()` - Create subjects with teacher assignments
   - `update_subject_with_teachers()` - Update subjects and reassign teachers
   - `soft_delete_subject()` - Soft delete with dependency checking
   - `check_subject_dependencies()` - Check if subject can be deleted
   - `copy_subjects_for_academic_year()` - Copy subjects between academic years

6. **Teacher Department Auto-Sync**
   - Automatically syncs teacher department from subject assignments
   - Trigger-based updates
   - Manual sync function available

7. **Auto-Create Role Profiles**
   - Automatically creates teacher/student profiles when users are created
   - Prevents orphaned user records
   - Backfills existing data

8. **Row Level Security (RLS)**
   - Comprehensive policies for all tables
   - Role-based access control (admin, teacher, student, anonymous)
   - Security definer functions for complex queries

## Archived Files

### Migration History
- **Location**: `supabase/migrations/archive/`
- **Contents**: 15 individual migration files
- **Purpose**: Historical reference and audit trail

### Old Scripts
- **Location**: `FRAMS/scripts/archive/`
- **Contents**: Old SQL fix scripts and helper files
- **Purpose**: Historical reference

## Migration Timeline

### February 28, 2026
- Created subject management tables
- Added stored procedures for CRUD operations
- Fixed RLS circular dependencies

### March 7-8, 2026
- Added anonymous access policies
- Enabled public read for reference data

### March 9, 2026
- Added auto-create role profiles
- Implemented teacher department auto-sync
- Added assignment attachment support
- Consolidated all migrations into single file

## For Developers

### New Deployments
Run the consolidated schema:
```sql
-- In Supabase SQL Editor
\i supabase/complete_database.sql
```

### Existing Databases
No action needed - all migrations have already been applied.

### Adding New Migrations
Create new migration files in `supabase/migrations/` with timestamp prefix:
```
20260309120000_your_migration_name.sql
```

## Benefits of Consolidation

1. **Easier Deployment** - Single file to run for new databases
2. **Better Documentation** - All schema in one place
3. **Reduced Complexity** - No need to track migration order
4. **Historical Reference** - Original migrations preserved in archive
5. **Cleaner Codebase** - Removed redundant fix scripts

## Archived Date

March 9, 2026
