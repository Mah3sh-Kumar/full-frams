# Profile Department Fix

## Issue
Teachers see "Department: Not assigned" in their Profile screen, which looks unprofessional.

## Solutions Implemented

### 1. Hide "Not assigned" Department (UI Fix) ✅

**Changes Made:**
- Modified `ProfileScreen.tsx` to hide department field when it's empty or "Not assigned"
- Modified `useProfile.ts` hook to filter out "Not assigned" values
- Department field only shows when a proper department is assigned

**Files Modified:**
- `FRAMS/screens/ProfileScreen.tsx`
  - Added condition: `profile.department && profile.department !== 'Not assigned'`
  - Applied to both editable input and read-only display
  - Added placeholder text for better UX

- `FRAMS/hooks/useProfile.ts`
  - Filters out "Not assigned" when fetching profile
  - Returns empty string instead of "Not assigned"

**Result:**
- Teachers without assigned departments won't see the field at all
- Cleaner, more professional profile screen
- No confusing "Not assigned" text

### 2. Assign Proper Department (Database Fix)

**Option A: Fix Specific Teacher**

Run this SQL in Supabase SQL Editor:

```sql
-- Update specific teacher's department
UPDATE public.teachers
SET department = 'Computer Science'  -- Change to actual department
WHERE id = '2f50604d-a472-42b5-b1ce-817ca038fa75';
```

**Option B: Use the Script**

Use the comprehensive script:
- `FRAMS/scripts/assign-teacher-department.sql`

This script provides multiple options:
1. Fix specific teacher
2. Update all "Not assigned" teachers
3. Auto-assign based on subjects taught

**Option C: Use Admin Panel**

1. Log in as admin
2. Go to User Management
3. Find the teacher
4. Edit and assign department

## Visual Comparison

### Before (Showing "Not assigned"):
```
┌─────────────────────────────────┐
│ Personal Information            │
├─────────────────────────────────┤
│ Full Name: John Doe             │
│ Email: john@example.com         │
│ Department: Not assigned        │ ← Looks unprofessional
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Additional Information          │
├─────────────────────────────────┤
│ Role: Teacher                   │
│ Department: Not assigned        │ ← Duplicate display
└─────────────────────────────────┘
```

### After (Hidden when not assigned):
```
┌─────────────────────────────────┐
│ Personal Information            │
├─────────────────────────────────┤
│ Full Name: John Doe             │
│ Email: john@example.com         │
│                                 │ ← Department field hidden
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Additional Information          │
├─────────────────────────────────┤
│ Role: Teacher                   │
│                                 │ ← Department hidden here too
└─────────────────────────────────┘
```

### After (With proper department):
```
┌─────────────────────────────────┐
│ Personal Information            │
├─────────────────────────────────┤
│ Full Name: John Doe             │
│ Email: john@example.com         │
│ Department: Computer Science    │ ← Shows when assigned
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Additional Information          │
├─────────────────────────────────┤
│ Role: Teacher                   │
│ Department: Computer Science    │ ← Shows here too
└─────────────────────────────────┘
```

## Code Changes

### ProfileScreen.tsx

**Before:**
```typescript
{role === 'teacher' && (
    <View style={styles.inputSpacing}>
        <Input
            label="Department"
            value={editedDepartment}
            onChangeText={setEditedDepartment}
            disabled={!editing}
        />
    </View>
)}
```

**After:**
```typescript
{role === 'teacher' && profile.department && profile.department !== 'Not assigned' && (
    <View style={styles.inputSpacing}>
        <Input
            label="Department"
            value={editedDepartment}
            onChangeText={setEditedDepartment}
            disabled={!editing}
            placeholder="Enter your department"
        />
    </View>
)}
```

### useProfile.ts

**Before:**
```typescript
else if (role === 'teacher' && data.teachers) {
    profileData.department = data.teachers.department || '';
}
```

**After:**
```typescript
else if (role === 'teacher' && data.teachers) {
    const dept = data.teachers.department || '';
    // Only set department if it's not "Not assigned"
    profileData.department = (dept && dept !== 'Not assigned') ? dept : '';
}
```

## Benefits

✅ **Professional Appearance** - No "Not assigned" text visible  
✅ **Cleaner UI** - Fields only show when they have meaningful data  
✅ **Better UX** - Teachers aren't confused by placeholder text  
✅ **Flexible** - Can assign departments later without code changes  
✅ **Consistent** - Same behavior in both editable and read-only sections  

## How to Assign Departments

### Method 1: SQL (Fastest)
```sql
UPDATE public.teachers
SET department = 'Computer Science'
WHERE id = 'teacher-user-id';
```

### Method 2: Admin Panel
1. Admin Dashboard → User Management
2. Find teacher → Edit
3. Assign department → Save

### Method 3: Teacher Self-Service
1. Teacher logs in → Profile
2. Click "Edit Profile"
3. Enter department → Save

## Common Departments

For reference, common department names:
- Computer Science
- Information Technology
- Electronics and Communication
- Mechanical Engineering
- Civil Engineering
- Electrical Engineering
- Mathematics
- Physics
- Chemistry
- English
- General

## Testing

After applying fixes:

1. **Test with "Not assigned" teacher:**
   - ✅ Department field should be hidden
   - ✅ Profile should look clean
   - ✅ No "Not assigned" text visible

2. **Test with assigned department:**
   - ✅ Department field should be visible
   - ✅ Shows correct department name
   - ✅ Can edit when in edit mode

3. **Test editing:**
   - ✅ Can add department when editing
   - ✅ Changes save correctly
   - ✅ Updates reflect immediately

## Related Files

- `FRAMS/screens/ProfileScreen.tsx` - Profile UI
- `FRAMS/hooks/useProfile.ts` - Profile data fetching
- `FRAMS/scripts/assign-teacher-department.sql` - SQL script
- `FRAMS/scripts/fix-specific-teacher-department.sql` - Quick fix for one teacher
- `FRAMS/docs/TEACHER_DASHBOARD_UI_IMPROVEMENTS.md` - Related dashboard fixes

## Migration Notes

If you've already applied the permanent fix migration:
- `supabase/migrations/20260309000000_auto_create_role_profiles.sql`

New teachers will get "Not assigned" by default, which will now be hidden in the UI. Admins can assign proper departments later.

## Future Improvements

Consider:
- Adding department dropdown in admin panel
- Auto-suggesting departments based on subjects taught
- Allowing teachers to request department changes
- Adding department validation
- Creating department management screen for admins
