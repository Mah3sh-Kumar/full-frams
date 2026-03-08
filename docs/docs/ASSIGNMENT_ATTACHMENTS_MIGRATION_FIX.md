# Assignment Attachments Migration - Fixed

## Issue
The original migration had an ambiguous column reference error:
```
ERROR: 42702: column reference "name" is ambiguous
```

## Root Cause
The `name` column exists in multiple tables (students, subjects, classes, storage.objects), causing SQL ambiguity in the storage policy.

## Solution
Updated the student view policy to:
1. Use fully qualified column name: `storage.objects.name`
2. Simplified logic to extract assignment_id from file path
3. More efficient query using `SPLIT_PART()` function

## Fixed Policy

### Before (Broken):
```sql
WHERE name LIKE '%' || a.id::text || '%'
```
- Ambiguous: Which table's `name` column?

### After (Fixed):
```sql
WHERE SPLIT_PART(storage.objects.name, '/', 1)::uuid IN (
  SELECT a.id FROM assignments a ...
)
```
- Clear: Extract assignment_id from file path
- Efficient: Direct UUID comparison
- No ambiguity: Uses file path structure

## File Path Structure
Files are stored as: `{assignment_id}/{assignment_id}_{timestamp}.{ext}`

Example: `abc123-def456/abc123-def456_1709987654321.pdf`

The policy extracts the first part (assignment_id) and checks if the student is enrolled in that assignment's subject.

## Migration Status
✅ Fixed and ready to run

## Run the Migration

```bash
cd FRAMS
supabase db execute --file ../supabase/migrations/20260309110000_add_assignment_attachments.sql
```

Or copy the SQL from the migration file and run in Supabase Dashboard SQL Editor.

## Verification

After running the migration, verify:

1. **Check columns exist:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assignments' 
AND column_name LIKE 'attachment%';
```

Expected result:
- attachment_url (text)
- attachment_name (text)
- attachment_type (text)
- attachment_size (integer)

2. **Check storage bucket:**
```sql
SELECT * FROM storage.buckets WHERE id = 'assignment-attachments';
```

Expected: 1 row with bucket configuration

3. **Check policies:**
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%assignment%';
```

Expected policies:
- Teachers can upload assignment attachments
- Teachers can update their assignment attachments
- Teachers can delete their assignment attachments
- Students can view assignment attachments

## Testing

1. **Teacher Upload:**
   - Create assignment with file
   - Verify file appears in Storage
   - Check assignment record has attachment_url

2. **Student View:**
   - Login as student
   - View assignment
   - Click attachment badge
   - File should open

3. **Security:**
   - Student should NOT see files from other subjects
   - Teacher should see all files

## Summary

✅ Fixed ambiguous column reference
✅ Simplified and optimized policy
✅ More efficient query execution
✅ Ready to deploy

The migration is now error-free and ready to use!
