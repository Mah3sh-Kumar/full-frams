# Quick Test Checklist - Dropdown Menus

## Pre-Test Setup
- [ ] Database seeded (SEED_FACULTY_STRUCTURE.sql executed)
- [ ] App started (`npm start`)
- [ ] DevTools open (F12)
- [ ] Console tab visible

## Test 1: Department Dropdown (Teacher)
- [ ] Navigate to SignUp screen
- [ ] Select "Teacher" role
- [ ] Check console for: `🔍 getDepartments called`
- [ ] Check console for: `✅ getDepartments - Returning:`
- [ ] Click Department dropdown
- [ ] Verify 5 items appear:
  - [ ] Science
  - [ ] Commerce
  - [ ] Arts
  - [ ] Law
  - [ ] Computer Science
- [ ] Select one item
- [ ] Verify selection displays

## Test 2: Class Level Dropdown (Student)
- [ ] Select "Student" role
- [ ] Check console for: `🔍 getClasses called`
- [ ] Check console for: `✅ getClasses - Returning:`
- [ ] Click Class Level dropdown
- [ ] Verify 18 items appear
- [ ] Verify items include:
  - [ ] F.Y. B.Sc.
  - [ ] S.Y. B.Sc.
  - [ ] T.Y. B.Sc.
  - [ ] F.Y. B.Com
  - [ ] 1st Year LL.B.
  - [ ] 5th Year LL.B.
- [ ] Select one item
- [ ] Verify selection displays

## Test 3: Branch Dropdown (Student)
- [ ] Class Level should already be selected
- [ ] Check console for: `🔍 getBranches called`
- [ ] Check console for: `✅ getBranches - Returning:`
- [ ] Click Branch dropdown
- [ ] Verify branches appear for selected class
- [ ] Select one item
- [ ] Verify selection displays

## Error Checks
- [ ] No red errors in console
- [ ] No network errors (check Network tab)
- [ ] No "undefined" values in dropdowns
- [ ] No "permission denied" errors

## Visual Checks
- [ ] Dropdowns have proper styling
- [ ] Icons display correctly
- [ ] Text is readable
- [ ] Modal opens/closes smoothly
- [ ] Search works (if enabled)

## Final Verification
- [ ] All three dropdowns work
- [ ] No console errors
- [ ] No network errors
- [ ] Data displays correctly
- [ ] Can select items

## If Any Test Fails

1. **Check console logs** - Look for error messages
2. **Check Network tab** - Look for failed requests
3. **Verify database** - Run: `SELECT COUNT(*) FROM org_departments;`
4. **Hard refresh** - Ctrl+Shift+R
5. **Check Supabase** - Verify connection and RLS policies

## Console Log Patterns

### ✅ Success Pattern
```
🔍 [Function] called with [params]
📊 [Function] - Raw response: { data: [...], error: null }
✅ [Function] - Returning: [...]
```

### ❌ Error Pattern
```
❌ Supabase error in [Function]: { code: '...', message: '...' }
```

## Quick Fixes

| Issue | Fix |
|-------|-----|
| Empty dropdown | Check console for errors |
| No data | Verify database seeding |
| Network error | Check Supabase connection |
| Dropdown doesn't update | Hard refresh browser |
| Only some work | Check specific table in database |

## Test Result: _______________

- [ ] PASS - All dropdowns working
- [ ] FAIL - See errors above
- [ ] PARTIAL - Some dropdowns working

## Notes
_________________________________
_________________________________
_________________________________

---

**Date Tested:** _______________
**Tester:** _______________
**Status:** _______________
