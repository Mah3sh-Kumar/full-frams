# Visual Test Guide - Dropdown Menus

## What You Should See

### Step 1: Open SignUp Screen
```
┌─────────────────────────────────────┐
│         Create Account              │
│      Sign up to get started         │
├─────────────────────────────────────┤
│  I am a:                            │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ 👨‍🎓 Student  │  │ 💼 Teacher   │ │
│  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
```

### Step 2: Select Teacher Role
```
┌─────────────────────────────────────┐
│         Create Account              │
├─────────────────────────────────────┤
│  I am a:                            │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ 👨‍🎓 Student  │  │ 💼 Teacher   │ │ ← Click here
│  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────┤
│  Full Name                          │
│  [________________]                 │
│                                     │
│  Email                              │
│  [________________]                 │
│                                     │
│  Password                           │
│  [________________]  👁️             │
│                                     │
│  Confirm Password                   │
│  [________________]  👁️             │
│                                     │
│  Department                         │
│  ┌─────────────────────────────────┐│
│  │ 🏢 Select an option      ▼      ││ ← Click here
│  └─────────────────────────────────┘│
│                                     │
│  [Sign Up Button]                   │
└─────────────────────────────────────┘
```

### Step 3: Click Department Dropdown
```
┌─────────────────────────────────────┐
│  Department                         │
│  ┌─────────────────────────────────┐│
│  │ 🏢 Select an option      ▲      ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Select Department               ││
│  │ ┌───────────────────────────────┤│
│  │ │ 🔍 Search department...       ││
│  │ └───────────────────────────────┤│
│  │                                 ││
│  │ ┌─────────────────────────────┐ ││
│  │ │ 🏫 Science                  │ ││
│  │ └─────────────────────────────┘ ││
│  │ ┌─────────────────────────────┐ ││
│  │ │ 💼 Commerce                 │ ││
│  │ └─────────────────────────────┘ ││
│  │ ┌─────────────────────────────┐ ││
│  │ │ 📚 Arts                     │ ││
│  │ └─────────────────────────────┘ ││
│  │ ┌─────────────────────────────┐ ││
│  │ │ ⚖️  Law                     │ ││
│  │ └─────────────────────────────┘ ││
│  │ ┌─────────────────────────────┐ ││
│  │ │ 💻 Computer Science         │ ││
│  │ └─────────────────────────────┘ ││
│  │                                 ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Step 4: Select Department
```
┌─────────────────────────────────────┐
│  Department                         │
│  ┌─────────────────────────────────┐│
│  │ 🏫 Science                  ✓   ││ ← Selected
│  └─────────────────────────────────┘│
│                                     │
│  [Sign Up Button]                   │
└─────────────────────────────────────┘
```

## Console Output You Should See

### When Opening SignUp (Teacher)
```
🔍 getDepartments called with includeInactive: false
📊 getDepartments - Raw response: { 
  data: [
    { id: 'uuid1', name: 'Science', code: 'science_dept', ... },
    { id: 'uuid2', name: 'Commerce', code: 'commerce_dept', ... },
    { id: 'uuid3', name: 'Arts', code: 'arts_dept', ... },
    { id: 'uuid4', name: 'Law', code: 'law_dept', ... },
    { id: 'uuid5', name: 'Computer Science', code: 'cs_dept', ... }
  ], 
  error: null 
}
✅ getDepartments - Returning: [...]
📊 Departments fetched: [...]
✅ Setting default department to: Science
```

### When Opening SignUp (Student)
```
🔍 getClasses called with includeInactive: false
📊 getClasses - Raw response: { 
  data: [
    { id: 'uuid1', name: 'F.Y. B.Sc.', value: 'fy_bsc', ... },
    { id: 'uuid2', name: 'S.Y. B.Sc.', value: 'sy_bsc', ... },
    ... (18 total)
  ], 
  error: null 
}
✅ getClasses - Returning: [...]
📊 Classes fetched: [...]
```

### When Selecting a Class (Student)
```
🔍 getBranches called with classId: 'uuid1', includeInactive: false
📊 getBranches - Raw response: { 
  data: [
    { id: 'uuid1', name: 'Physics', code: 'physics_branch', ... },
    { id: 'uuid2', name: 'Chemistry', code: 'chemistry_branch', ... },
    { id: 'uuid3', name: 'Computer Science', code: 'cs_branch', ... },
    { id: 'uuid4', name: 'Information Technology', code: 'it_branch', ... },
    { id: 'uuid5', name: 'Biotechnology', code: 'biotech_branch', ... }
  ], 
  error: null 
}
✅ getBranches - Returning: [...]
```

## Error Scenarios

### Error: Empty Dropdown
```
❌ Supabase error in getDepartments: { 
  code: 'PGRST116', 
  message: 'relation "org_departments" does not exist',
  details: null,
  hint: null
}
❌ Exception in getDepartments: Error: relation "org_departments" does not exist
```

**Fix:** Verify table exists in Supabase

### Error: Permission Denied
```
❌ Supabase error in getDepartments: { 
  code: '42501', 
  message: 'permission denied for schema public',
  details: null,
  hint: null
}
```

**Fix:** Check RLS policies in Supabase

### Error: No Data
```
✅ getDepartments - Returning: []
```

**Fix:** Verify data was seeded (run SEED_FACULTY_STRUCTURE.sql)

## Success Indicators

### ✅ All Good
- Console shows 🔍, 📊, ✅ logs
- Dropdown shows items
- Can select items
- No ❌ errors
- No network errors

### ⚠️ Partial Success
- Some dropdowns work, others don't
- Check which function is failing
- Verify that specific table has data

### ❌ Not Working
- Console shows ❌ errors
- Dropdown is empty
- Network errors in DevTools
- Check troubleshooting guide

## Testing Checklist

### Visual Checks
- [ ] Department dropdown shows 5 items
- [ ] Class Level dropdown shows 18 items
- [ ] Branch dropdown shows items when class selected
- [ ] Icons display correctly
- [ ] Text is readable
- [ ] Modal opens/closes smoothly

### Functional Checks
- [ ] Can click dropdown
- [ ] Can select items
- [ ] Selected value displays
- [ ] Search works (if enabled)
- [ ] Can change selection

### Console Checks
- [ ] 🔍 logs appear
- [ ] 📊 logs show data
- [ ] ✅ logs confirm success
- [ ] No ❌ error logs
- [ ] No network errors

### Data Checks
- [ ] 5 departments shown
- [ ] 18 classes shown
- [ ] Branches match selected class
- [ ] All items have icons
- [ ] All items have names

## Quick Troubleshooting

| What You See | What to Check |
|--------------|---------------|
| Empty dropdown | Console logs - is data returned? |
| Error in console | Check error code and message |
| Only some work | Verify specific table has data |
| Dropdown doesn't update | Hard refresh browser |
| Network errors | Check Supabase connection |
| No icons | Check SelectPicker component |
| Text cut off | Check CSS/styling |

## Next Steps

1. **If all checks pass:** ✅ Dropdowns are working!
2. **If some fail:** Check troubleshooting guide
3. **If all fail:** Check database and Supabase connection

---

**Remember:** Check the console logs first! They tell you exactly what's happening.
