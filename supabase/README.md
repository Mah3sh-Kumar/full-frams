# Supabase Database Schema

## Quick Start

### For New Deployments

Run the consolidated schema file in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of complete_database.sql
-- Or use the Supabase CLI:
supabase db reset
```

### For Existing Databases

No action needed - all migrations have already been applied.

## Files

### `complete_database.sql`
Complete database schema including:
- All tables (academic_years, subjects, subject_teachers)
- All stored procedures and functions
- Row Level Security policies
- Triggers for auto-sync and auto-create
- Storage bucket configuration
- Backfill scripts

### `migrations/archive/`
Historical migration files preserved for reference. See `migrations/archive/README.md` for details.

## Database Structure

### Core Tables

#### `academic_years`
- Manages academic year periods
- Unique year names (e.g., "2024-2025")
- Date range validation
- Current year tracking

#### `subjects`
- Academic subjects/courses
- Linked to classes and academic years
- Soft delete support
- Comprehensive audit trails

#### `subject_teachers`
- Many-to-many relationship between subjects and teachers
- Primary teacher designation
- Assignment audit metadata

#### `assignments`
- Assignment management
- File attachment support (PDF, Word)
- Linked to subjects

### Key Features

#### 1. Teacher Department Auto-Sync
Automatically syncs teacher department from subject assignments:
```sql
-- Triggered automatically when teacher is assigned to subject
-- Or manually sync:
SELECT sync_teacher_department_manual('teacher-uuid');
```

#### 2. Auto-Create Role Profiles
Automatically creates teacher/student profiles when users are created:
- Teachers get default department "Not assigned"
- Students get temporary enrollment number
- Prevents orphaned user records

#### 3. Assignment Attachments
File upload support with storage bucket:
- Max size: 10MB
- Allowed types: PDF, DOC, DOCX
- Row-level security for access control

#### 4. Row Level Security
Comprehensive policies for all roles:
- **Admin**: Full access to all data
- **Teacher**: Access to assigned subjects and students
- **Student**: Access to own class subjects and assignments
- **Anonymous**: Read-only access to reference data

## Stored Procedures

### Subject Management

```sql
-- Create subject with teachers
SELECT create_subject_with_teachers(
  p_name := 'Mathematics',
  p_code := 'math_101',
  p_class_id := 'class-uuid',
  p_academic_year_id := 'year-uuid',
  p_teacher_ids := ARRAY['teacher1-uuid', 'teacher2-uuid'],
  p_primary_teacher_id := 'teacher1-uuid',
  p_created_by := 'admin-uuid'
);

-- Update subject
SELECT update_subject_with_teachers(
  p_subject_id := 'subject-uuid',
  p_name := 'Advanced Mathematics',
  p_code := 'math_101',
  p_class_id := 'class-uuid',
  p_is_active := true,
  p_teacher_ids := ARRAY['teacher1-uuid'],
  p_primary_teacher_id := 'teacher1-uuid',
  p_updated_by := 'admin-uuid'
);

-- Soft delete subject
SELECT soft_delete_subject(
  p_subject_id := 'subject-uuid',
  p_deleted_by := 'admin-uuid'
);

-- Check dependencies before delete
SELECT check_subject_dependencies('subject-uuid');

-- Copy subjects to new academic year
SELECT copy_subjects_for_academic_year(
  p_source_year_id := 'source-year-uuid',
  p_target_year_id := 'target-year-uuid',
  p_created_by := 'admin-uuid'
);
```

### Helper Functions

```sql
-- Get department from subject
SELECT get_department_from_subject('subject-uuid');

-- Manually sync teacher department
SELECT sync_teacher_department_manual('teacher-uuid');
```

## Storage Buckets

### `assignment-attachments`
- **Access**: Authenticated users only
- **Size Limit**: 10MB
- **Allowed Types**: PDF, DOC, DOCX
- **Policies**:
  - Teachers can upload/update/delete
  - Students can view attachments for their subjects

## Indexes

Optimized indexes for common queries:
- Academic year lookups
- Subject filtering by class/year
- Teacher assignment lookups
- Active/deleted status filtering

## Triggers

### Auto-Update Timestamps
- `trigger_academic_years_updated_at`
- `trigger_subjects_updated_at`

### Auto-Sync Department
- `trigger_sync_teacher_department` - Syncs teacher department when assigned to subject

### Auto-Create Profiles
- `trigger_auto_create_role_profile` - Creates teacher/student profile on user creation

## Migration History

See `migrations/archive/README.md` for complete migration history.

## Support

For issues or questions:
1. Check `docs/DATABASE_CONSOLIDATION.md` for detailed information
2. Review archived migrations in `migrations/archive/`
3. Consult stored procedure documentation above

---

Last Updated: March 9, 2026
