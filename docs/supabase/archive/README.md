# Migration Archive

This folder contains the original migration files that have been consolidated into `supabase/complete_database.sql`.

## Why Archive?

The individual migration files have been consolidated into a single, comprehensive database schema file for easier management and deployment. These archived files are kept for historical reference and audit purposes.

## Migration History

### Subject Management (2026-02-28)
- `20260228065025_create_subjects_tables.sql` - Created academic_years, subjects, and subject_teachers tables
- `20260228065107_create_subject_with_teachers_rpc.sql` - Function to create subjects with teacher assignments
- `20260228065132_update_subject_with_teachers_rpc.sql` - Function to update subjects and teachers
- `20260228065142_soft_delete_subject_rpc.sql` - Soft delete functionality for subjects
- `20260228065151_check_subject_dependencies_rpc.sql` - Check dependencies before deletion
- `20260228065204_copy_subjects_for_academic_year_rpc.sql` - Copy subjects between academic years
- `20260228065211_enable_rls_on_users.sql` - Enable RLS on users table

### RLS Fixes (2026-02-28)
- `20260228100618_fix_subjects_infinite_recursion.sql` - Fixed circular RLS dependencies
- `20260228100927_fix_circular_rls_with_security_definer.sql` - Security definer functions for RLS

### Anonymous Access (2026-03-07 to 2026-03-08)
- `20260307190343_add_academic_years_anon_select_policy.sql` - Allow anonymous read of academic years
- `20260308085110_allow_anon_read_subjects.sql` - Allow anonymous read of active subjects

### Role Profiles & Department Sync (2026-03-09)
- `20260309000000_auto_create_role_profiles.sql` - Auto-create teacher/student profiles on user creation
- `20260309095900_fix_teachers_table_for_sync.sql` - Add updated_at column to teachers table
- `20260309100000_auto_sync_teacher_department.sql` - Auto-sync teacher department from subject assignments

### Assignment Attachments (2026-03-09)
- `20260309110000_add_assignment_attachments.sql` - Add file upload support for assignments

## Using the Consolidated Schema

For new deployments, use `supabase/complete_database.sql` instead of running these individual migrations.

For existing databases, these migrations have already been applied and should not be run again.

## Archived Date

March 9, 2026
