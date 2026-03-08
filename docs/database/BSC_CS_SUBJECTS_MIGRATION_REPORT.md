# BSc Computer Science Subjects Migration Report

**Date:** March 8, 2026  
**Migration:** `add_bsc_cs_subjects_mumbai_university`  
**Status:** ✅ COMPLETED SUCCESSFULLY

---

## Summary

Successfully added 42 subjects for BSc Computer Science according to Mumbai University syllabus covering all 6 semesters (First Year, Second Year, and Third Year).

### Subjects Added by Class

| Class | Total Subjects | Theory | Practical |
|-------|---------------|--------|-----------|
| F.Y. B.Sc. (Computer Science) | 12 | 8 | 4 |
| S.Y. B.Sc. (Computer Science) | 14 | 8 | 6 |
| T.Y. B.Sc. (Computer Science) | 16 | 8 | 8 |
| **TOTAL** | **42** | **24** | **18** |

---

## Database Schema Verification

### Hierarchy Structure ✅

The complete hierarchy is working correctly:

```
Department: Science & Technology
  └─ Branch: Computer Science (cs_dept)
      ├─ Class: F.Y. B.Sc. (Computer Science) - 2025-2026
      │   └─ 12 Subjects (Semesters 1-2)
      ├─ Class: S.Y. B.Sc. (Computer Science) - 2025-2026
      │   └─ 14 Subjects (Semesters 3-4)
      └─ Class: T.Y. B.Sc. (Computer Science) - 2025-2026
          └─ 16 Subjects (Semesters 5-6)
```

### Key IDs

- **Department ID:** `1975fa97-6d65-44f4-9d50-a8b392f37257` (Science & Technology)
- **Branch ID:** `3c9c6aae-0de2-4954-bba5-c51108c7c8ef` (Computer Science)
- **Academic Year ID:** `48cc1693-1fa1-4a52-beaa-efb0642e68dc` (2025-2026)

**Class IDs:**
- FY BSc CS: `9d9333f5-8377-48a8-8731-1b0351055075`
- SY BSc CS: `eb53a436-2a8f-4ed3-917e-869ae3ccb6bb`
- TY BSc CS: `b95d0610-4ebb-46eb-9dd9-63cf0ecdd6e1`

---

## Subject Details

### First Year (Semesters 1-2) - 12 Subjects

**Semester 1:**
1. Programming in C (uscs101) - Theory
2. Programming in C Practical (uscsp101) - Practical
3. Database Systems (uscs102) - Theory
4. Database Systems Practical (uscsp102) - Practical
5. Discrete Mathematics (uscs103) - Theory
6. Descriptive Statistics and Probability (uscs104) - Theory

**Semester 2:**
7. Object Oriented Programming with C++ (uscs201) - Theory
8. Object Oriented Programming with C++ Practical (uscsp201) - Practical
9. Data Structures (uscs202) - Theory
10. Data Structures Practical (uscsp202) - Practical
11. Computer Organization and Architecture (uscs203) - Theory
12. Numerical and Statistical Methods (uscs204) - Theory

### Second Year (Semesters 3-4) - 14 Subjects

**Semester 3:**
1. Python Programming (uscs301) - Theory
2. Python Programming Practical (uscsp301) - Practical
3. Data Communication and Computer Networks (uscs302) - Theory
4. Data Communication and Computer Networks Practical (uscsp302) - Practical
5. Operating Systems (uscs303) - Theory
6. Operating Systems Practical (uscsp303) - Practical
7. Microprocessor Architecture (uscs304) - Theory

**Semester 4:**
8. Core Java (uscs401) - Theory
9. Core Java Practical (uscsp401) - Practical
10. Introduction to Embedded Systems (uscs402) - Theory
11. Introduction to Embedded Systems Practical (uscsp402) - Practical
12. Computer Graphics and Animation (uscs403) - Theory
13. Computer Graphics and Animation Practical (uscsp403) - Practical
14. Software Engineering (uscs404) - Theory

### Third Year (Semesters 5-6) - 16 Subjects

**Semester 5:**
1. Linux System Administration (uscs501) - Theory
2. Linux System Administration Practical (uscsp501) - Practical
3. Advanced Java (uscs502) - Theory
4. Advanced Java Practical (uscsp502) - Practical
5. Internet of Things (uscs503) - Theory
6. Internet of Things Practical (uscsp503) - Practical
7. Advanced Web Technologies (uscs504) - Theory
8. Advanced Web Technologies Practical (uscsp504) - Practical

**Semester 6:**
9. Artificial Intelligence (uscs601) - Theory
10. Artificial Intelligence Practical (uscsp601) - Practical
11. Data Science (uscs602) - Theory
12. Data Science Practical (uscsp602) - Practical
13. Software Testing (uscs603) - Theory
14. Software Testing Practical (uscsp603) - Practical
15. Geographic Information Systems (uscs604) - Theory
16. Geographic Information Systems Practical (uscsp604) - Practical

---

## Data Integrity Checks

### ✅ No Duplicate Subjects
- Verified: No duplicate subject codes within the same class
- Constraint: `(code, class_id, academic_year_id)` is unique

### ✅ Proper Foreign Key Relationships
- All subjects linked to valid `class_id`
- All subjects linked to valid `academic_year_id` (2025-2026)
- All subjects have `created_by` set to admin user

### ✅ Active Status
- All subjects have `is_active = true`
- All subjects have `deleted_at = NULL`

### ✅ Filtering Works Correctly
Tested query for UI filtering:
```sql
SELECT s.id, s.name, s.code, s.is_active
FROM subjects s
WHERE s.class_id = '<selected_class_id>'
AND s.is_active = true
AND s.deleted_at IS NULL
ORDER BY s.name;
```

**Result:** Returns only subjects for the selected class ✅

---

## UI Filtering Verification

The hierarchical filtering in the FRAMS app will work as follows:

1. **Select Department** → Science & Technology
2. **Select Branch** → Computer Science
3. **Select Class** → F.Y. B.Sc. CS / S.Y. B.Sc. CS / T.Y. B.Sc. CS
4. **View Subjects** → Only subjects for that specific class are shown

### Sample Query Results

**For F.Y. B.Sc. CS:**
- Computer Organization and Architecture (uscs203)
- Data Structures (uscs202)
- Data Structures Practical (uscsp202)
- Database Systems (uscs102)
- Database Systems Practical (uscsp102)
- ... (12 total)

**For S.Y. B.Sc. CS:**
- Core Java (uscs401)
- Core Java Practical (uscsp401)
- Data Communication and Computer Networks (uscs302)
- ... (14 total)

**For T.Y. B.Sc. CS:**
- Advanced Java (uscs502)
- Advanced Java Practical (uscsp502)
- Artificial Intelligence (uscs601)
- ... (16 total)

---

## Migration Files

### Created Files:
1. `Face_Reco/database/migrations/add_bsc_cs_subjects.py` - Python migration script
2. Migration applied via Supabase: `add_bsc_cs_subjects_mumbai_university`

### Migration SQL:
The migration uses a single INSERT statement with ON CONFLICT clause to prevent duplicates:
```sql
INSERT INTO subjects (name, code, class_id, academic_year_id, is_active, created_by, created_at, updated_at)
VALUES (...) 
ON CONFLICT (code, class_id, academic_year_id) DO NOTHING;
```

---

## Issues Found and Fixed

### ✅ Row-Level Security (RLS)
- **Issue:** Initial Python script failed due to RLS policies on subjects table
- **Solution:** Used Supabase migration tool which bypasses RLS with service role

### ✅ No Data Issues
- No duplicate subjects found
- No orphaned records
- All foreign keys valid
- Hierarchy properly linked

---

## Testing Recommendations

### Manual Testing Checklist:

1. **Login to FRAMS App**
   - [ ] Login as Teacher/Admin

2. **Test Department Selection**
   - [ ] Select "Science & Technology" department
   - [ ] Verify "Computer Science" branch appears

3. **Test Branch Selection**
   - [ ] Select "Computer Science" branch
   - [ ] Verify all 3 classes appear:
     - F.Y. B.Sc. (Computer Science)
     - S.Y. B.Sc. (Computer Science)
     - T.Y. B.Sc. (Computer Science)

4. **Test Class Selection & Subject Filtering**
   - [ ] Select "F.Y. B.Sc. (Computer Science)"
   - [ ] Verify exactly 12 subjects appear
   - [ ] Verify subjects are from Semesters 1-2 only
   
   - [ ] Select "S.Y. B.Sc. (Computer Science)"
   - [ ] Verify exactly 14 subjects appear
   - [ ] Verify subjects are from Semesters 3-4 only
   
   - [ ] Select "T.Y. B.Sc. (Computer Science)"
   - [ ] Verify exactly 16 subjects appear
   - [ ] Verify subjects are from Semesters 5-6 only

5. **Test Attendance Marking**
   - [ ] Select a subject
   - [ ] Mark attendance for a student
   - [ ] Verify attendance is saved correctly

---

## Conclusion

✅ **Migration completed successfully**  
✅ **All 42 subjects added for BSc Computer Science**  
✅ **Hierarchy working correctly: Department → Branch → Class → Subjects**  
✅ **No duplicates or data integrity issues**  
✅ **Filtering system verified and working**  

The FRAMS database is now ready for BSc Computer Science attendance management according to Mumbai University syllabus.
