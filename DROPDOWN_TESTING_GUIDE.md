# Dropdown Menu Testing & Troubleshooting Guide

## Overview
This guide helps you test and fix the dropdown menus in the FRAMS SignUp screen.

## Current Status
- ✅ Database seeded with 5 departments, 18 classes, 52 branches
- ✅ SelectPicker UI improved with better visual design
- ✅ Debug logging added to SignUpScreen and organization.ts
- ⏳ Testing pending - Need to verify dropdowns work

## Testing Steps

### Step 1: Start the App
```bash
# In FRAMS directory
npm start
# or
yarn start
```

### Step 2: Open SignUp Screen
1. Navigate to the SignUp screen
2. Select "Teacher" role to test Department dropdown
3. Select "Student" role to test Class Level and Branch dropdowns

### Step 3: Check Console Logs
Open browser DevTools (F12) and check the Console tab for:

**For Department Dropdown (Teacher):**
```
🔍 getDepartments called with includeInactive: false
📊 getDepartments - Raw response: { data: [...], error: null }
✅ getDepartments - Returning: [...]
📊 Departments fetched: [...]
✅ Setting default department to: [department_name]
```

**For Class Level Dropdown (Student):**
```
🔍 getClasses called with includeInactive: false
📊 getClasses - Raw response: { data: [...], error: null }
✅ getClasses - Returning: [...]
📊 Classes fetched: [...]
```

**For Branch Dropdown (Student):**
```
🔍 getBranches called with classId: [id], includeInactive: false
📊 getBranches - Raw response: { data: [...], error: null }
✅ getBranches - Returning: [...]
```

## Expected Results

### Department Dropdown Should Show:
- Science
- Commerce
- Arts
- Law
- Computer Science

### Class Level Dropdown Should Show:
- F.Y. B.Sc.
- S.Y. B.Sc.
- T.Y. B.Sc.
- F.Y. B.Com
- S.Y. B.Com
- T.Y. B.Com
- F.Y. BMS
- S.Y. BMS
- T.Y. BMS
- F.Y. B.A.
- S.Y. B.A.
- T.Y. B.A.
- 1st Year LL.B.
- 2nd Year LL.B.
- 3rd Year LL.B.
- 4th Year LL.B.
- 5th Year LL.B.

### Branch Dropdown Should Show (varies by class):
**For F.Y. B.Sc.:**
- Physics
- Chemistry
- Computer Science
- Information Technology
- Biotechnology

**For F.Y. B.Com:**
- B.Com
- BMS
- BAF
- BBI

**For F.Y. B.A.:**
- History
- Economics
- Psychology
- Languages

## Troubleshooting

### Issue 1: Dropdowns Show Empty
**Symptoms:**
- Dropdown button shows "Select an option"
- No items appear when clicked
- Console shows: `✅ getDepartments - Returning: []`

**Solutions:**
1. Verify database seeding was successful:
   - Run `SELECT COUNT(*) FROM org_departments;` in Supabase
   - Should return 5
2. Check if data is marked as active:
   - Run `SELECT * FROM org_departments WHERE is_active = true;`
   - Should return all 5 departments
3. Verify Supabase connection:
   - Check Network tab in DevTools
   - Look for failed API requests

### Issue 2: Console Shows Error
**Symptoms:**
- Console shows: `❌ Supabase error in getDepartments:`
- Error code and message displayed

**Solutions:**
1. Check error code:
   - `PGRST116`: Table not found - verify table name is `org_departments`
   - `42P01`: Relation does not exist - check table exists in Supabase
   - Other codes: Check Supabase error documentation

2. Verify table names:
   - Departments: `org_departments` ✓
   - Classes: `classes` ✓
   - Branches: `branches` ✓

3. Check Supabase RLS policies:
   - Ensure policies allow SELECT for authenticated users
   - Check if policies are too restrictive

### Issue 3: Data Loads But Dropdown Doesn't Update
**Symptoms:**
- Console shows data is fetched correctly
- Dropdown still shows "Select an option"
- No error messages

**Solutions:**
1. Check if data is being set to state:
   - Look for: `setDepartments(departmentsResult.data || [])`
   - Verify state is being updated

2. Check SelectPicker component:
   - Verify `items` prop is being passed correctly
   - Check if `value` prop matches an item's value

3. Force refresh:
   - Hard refresh browser (Ctrl+Shift+R)
   - Clear browser cache
   - Restart dev server

### Issue 4: Only Some Dropdowns Work
**Symptoms:**
- Department dropdown works but Class Level doesn't
- Or vice versa

**Solutions:**
1. Check which function is failing:
   - Look at console logs to identify which function returned empty
   - Verify that specific table has data

2. Check table relationships:
   - Classes should have `is_active = true`
   - Branches should have `class_id` matching a class ID

3. Verify data consistency:
   - Run: `SELECT * FROM classes WHERE is_active = true;`
   - Run: `SELECT * FROM branches WHERE is_active = true;`

## Manual Testing Checklist

- [ ] Department dropdown shows 5 items
- [ ] Class Level dropdown shows 18 items
- [ ] Branch dropdown shows items when class is selected
- [ ] Can select items from each dropdown
- [ ] Selected values are displayed correctly
- [ ] Search functionality works (if enabled)
- [ ] No console errors
- [ ] No network errors in DevTools

## Debug Commands

Run these in browser console to test directly:

```javascript
// Test getDepartments
import { getDepartments } from './FRAMS/lib/organization';
const depts = await getDepartments();
console.log('Departments:', depts);

// Test getClasses
import { getClasses } from './FRAMS/lib/organization';
const classes = await getClasses();
console.log('Classes:', classes);

// Test getBranches
import { getBranches } from './FRAMS/lib/organization';
const branches = await getBranches(classId);
console.log('Branches:', branches);
```

## Next Steps

1. **If dropdowns work:**
   - Test form submission with selected values
   - Verify data is saved to database correctly
   - Test on different devices/screen sizes

2. **If dropdowns don't work:**
   - Follow troubleshooting steps above
   - Check Supabase logs for errors
   - Verify RLS policies are correct
   - Contact support with console logs

## Files Modified

- `FRAMS/lib/organization.ts` - Added detailed logging to getDepartments, getClasses, getBranches
- `FRAMS/screens/SignUpScreen.tsx` - Already has debug logging
- `FRAMS/components/design-system/primitives/SelectPicker.tsx` - UI improvements
- `FRAMS/tests/dropdown-test.ts` - New test file for dropdown functionality

## Related Documentation

- Database Schema: See `SEED_FACULTY_STRUCTURE.sql`
- UI Improvements: See `DEPARTMENT_DROPDOWN_FIX_SUMMARY.md`
- Database Verification: See `DATABASE_CHECK_CORRECTED.md`
