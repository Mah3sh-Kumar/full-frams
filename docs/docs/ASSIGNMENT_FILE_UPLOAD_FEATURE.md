# Assignment File Upload Feature

## Overview
Teachers can now upload PDF or Word documents when creating assignments. These files are linked to the subject and visible to students enrolled in that subject.

---

## Features

### For Teachers
- ✅ Upload PDF or Word documents (up to 10MB)
- ✅ Files are automatically linked to assignments
- ✅ View uploaded files in assignment list
- ✅ Open/download files directly from the app
- ✅ Files stored securely in Supabase Storage

### For Students
- ✅ View assignments with attached files
- ✅ Download/open files for their subjects
- ✅ Secure access (only files for their enrolled subjects)

---

## Database Changes

### Migration: `20260309110000_add_assignment_attachments.sql`

**New Columns in `assignments` table:**
- `attachment_url` (TEXT) - URL to the file in Supabase Storage
- `attachment_name` (TEXT) - Original filename
- `attachment_type` (TEXT) - MIME type (e.g., application/pdf)
- `attachment_size` (INTEGER) - File size in bytes

**Storage Bucket:**
- Name: `assignment-attachments`
- Public: No (requires authentication)
- Size Limit: 10MB
- Allowed Types: PDF, DOC, DOCX

**Storage Policies:**
- Teachers can upload, update, and delete files
- Students can view files for their enrolled subjects
- Teachers can view all files

---

## File Upload Implementation

### New File: `FRAMS/lib/fileUpload.ts`

**Functions:**
- `pickDocument()` - Opens file picker for PDF/Word files
- `uploadAssignmentFile()` - Uploads file to Supabase Storage
- `deleteAssignmentFile()` - Deletes file from storage
- `downloadAssignmentFile()` - Opens file in browser/viewer
- `formatFileSize()` - Formats bytes to readable size
- `getFileIcon()` - Returns appropriate icon for file type

**Validation:**
- Maximum file size: 10MB
- Allowed types: PDF (.pdf), Word (.doc, .docx)
- Automatic file type detection

---

## UI Changes

### Create Assignment Modal

**New Section: "Attachment (Optional)"**
- File picker button
- File preview with:
  - File icon (based on type)
  - Filename
  - File size
  - Remove button
- Upload progress indicator

### Assignment List

**Attachment Badge:**
- Shows when assignment has a file
- Displays filename
- Clickable to open file
- Icon indicates file type

---

## Usage Flow

### Teacher Creates Assignment with File

1. Teacher clicks "Create Assignment"
2. Fills in required fields (Subject, Title, Max Score)
3. Clicks "Choose File" button
4. Selects PDF or Word document
5. File preview appears with name and size
6. Clicks "Create" button
7. Assignment is created
8. File is uploaded to storage
9. Assignment is updated with file info
10. Success message shown

### Student Views Assignment

1. Student navigates to their assignments
2. Sees assignment with attachment badge
3. Clicks on attachment badge
4. File opens in browser/viewer
5. Can download or view the file

---

## File Storage Structure

```
assignment-attachments/
├── {assignment_id}/
│   └── {assignment_id}_{timestamp}.{ext}
```

**Example:**
```
assignment-attachments/
├── abc123-def456/
│   └── abc123-def456_1709987654321.pdf
```

---

## Security

### Access Control
- **Teachers**: Full access to all assignment files
- **Students**: Only files for subjects they're enrolled in
- **Anonymous**: No access

### Storage Policies
```sql
-- Teachers can upload
CREATE POLICY "Teachers can upload assignment attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-attachments' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'teacher')
);

-- Students can view their subject files
CREATE POLICY "Students can view assignment attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-attachments' AND
  (teacher OR enrolled_in_subject)
);
```

---

## File Type Support

### Supported Formats

| Format | Extension | MIME Type | Icon |
|--------|-----------|-----------|------|
| PDF | .pdf | application/pdf | document-text |
| Word 97-2003 | .doc | application/msword | document |
| Word 2007+ | .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document | document |

---

## Error Handling

### File Size Validation
```typescript
if (file.size > MAX_FILE_SIZE) {
  Alert.alert('Error', 'File size exceeds 10MB limit');
}
```

### File Type Validation
```typescript
if (!ALLOWED_FILE_TYPES.includes(file.mimeType)) {
  Alert.alert('Error', 'Invalid file type. Please upload PDF or Word document');
}
```

### Upload Failure
- Assignment is still created
- User is notified of upload failure
- Can retry upload by editing assignment (future feature)

---

## Testing Checklist

### Teacher Flow
- [ ] Can open file picker
- [ ] Can select PDF file
- [ ] Can select Word file (.doc)
- [ ] Can select Word file (.docx)
- [ ] File preview shows correct name
- [ ] File preview shows correct size
- [ ] Can remove selected file
- [ ] Can create assignment without file
- [ ] Can create assignment with file
- [ ] Upload progress shows correctly
- [ ] Success message appears
- [ ] File appears in assignment list
- [ ] Can click to open file
- [ ] File opens correctly

### Student Flow
- [ ] Can see assignments with attachments
- [ ] Attachment badge shows filename
- [ ] Can click attachment badge
- [ ] File opens/downloads correctly
- [ ] Cannot see files from other subjects
- [ ] Cannot upload files

### Validation
- [ ] Files over 10MB are rejected
- [ ] Non-PDF/Word files are rejected
- [ ] Error messages are clear
- [ ] No crashes on invalid files

### Edge Cases
- [ ] Network failure during upload
- [ ] File picker cancellation
- [ ] Multiple rapid uploads
- [ ] Very long filenames
- [ ] Special characters in filenames
- [ ] Duplicate filenames

---

## Future Enhancements

### Planned Features
1. **Multiple File Uploads** - Allow multiple attachments per assignment
2. **File Preview** - In-app PDF viewer
3. **Edit Assignment Files** - Update/replace files after creation
4. **File History** - Track file versions
5. **Bulk Download** - Download all assignment files at once
6. **File Compression** - Automatic compression for large files
7. **More File Types** - Support for images, videos, etc.

### Student Features
1. **File Submission** - Students upload their work
2. **Submission History** - Track submitted files
3. **Feedback Files** - Teachers attach feedback documents

---

## Files Modified

### New Files
1. ✅ `supabase/migrations/20260309110000_add_assignment_attachments.sql`
2. ✅ `FRAMS/lib/fileUpload.ts`
3. ✅ `FRAMS/docs/ASSIGNMENT_FILE_UPLOAD_FEATURE.md`

### Modified Files
1. ✅ `FRAMS/screens/teacher/AssignmentManager.tsx`
   - Added file upload state
   - Added file picker function
   - Updated create assignment function
   - Added file upload UI
   - Added attachment display in list

---

## Dependencies

### Required Packages
- ✅ `expo-document-picker` - Already installed (v14.0.8)
- ✅ `@supabase/supabase-js` - Already installed
- ✅ `react-native` - Already installed

### No Additional Installation Required!

---

## Migration Instructions

### 1. Run Database Migration
```bash
cd FRAMS
supabase db execute --file ../supabase/migrations/20260309110000_add_assignment_attachments.sql
```

Or copy the SQL and run in Supabase Dashboard SQL Editor.

### 2. Verify Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Check that `assignment-attachments` bucket exists
3. Verify policies are active

### 3. Test the Feature
1. Open the app
2. Go to Assignment Manager
3. Click "Create Assignment"
4. Try uploading a file
5. Verify file appears in list
6. Try opening the file

---

## Summary

✅ Teachers can upload PDF/Word files to assignments
✅ Files are securely stored in Supabase Storage
✅ Students can view files for their subjects
✅ Clean UI with file preview and badges
✅ Proper validation and error handling
✅ No additional dependencies needed

**Ready to use!** Just run the migration and start uploading files!
