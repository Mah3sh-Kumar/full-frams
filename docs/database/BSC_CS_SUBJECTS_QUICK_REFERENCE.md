# BSc Computer Science - Quick Reference Card

## Class IDs
```
F.Y. B.Sc. CS: 9d9333f5-8377-48a8-8731-1b0351055075
S.Y. B.Sc. CS: eb53a436-2a8f-4ed3-917e-869ae3ccb6bb
T.Y. B.Sc. CS: b95d0610-4ebb-46eb-9dd9-63cf0ecdd6e1
```

## Subject Count by Year
- **First Year:** 12 subjects (6 per semester)
- **Second Year:** 14 subjects (7 per semester)
- **Third Year:** 16 subjects (8 per semester)
- **Total:** 42 subjects

## Semester Breakdown

### Semester 1 (FY)
1. Programming in C (uscs101)
2. Programming in C Practical (uscsp101)
3. Database Systems (uscs102)
4. Database Systems Practical (uscsp102)
5. Discrete Mathematics (uscs103)
6. Descriptive Statistics and Probability (uscs104)

### Semester 2 (FY)
1. Object Oriented Programming with C++ (uscs201)
2. OOP with C++ Practical (uscsp201)
3. Data Structures (uscs202)
4. Data Structures Practical (uscsp202)
5. Computer Organization and Architecture (uscs203)
6. Numerical and Statistical Methods (uscs204)

### Semester 3 (SY)
1. Python Programming (uscs301)
2. Python Programming Practical (uscsp301)
3. Data Communication and Computer Networks (uscs302)
4. Networks Practical (uscsp302)
5. Operating Systems (uscs303)
6. Operating Systems Practical (uscsp303)
7. Microprocessor Architecture (uscs304)

### Semester 4 (SY)
1. Core Java (uscs401)
2. Core Java Practical (uscsp401)
3. Introduction to Embedded Systems (uscs402)
4. Embedded Systems Practical (uscsp402)
5. Computer Graphics and Animation (uscs403)
6. Graphics Practical (uscsp403)
7. Software Engineering (uscs404)

### Semester 5 (TY)
1. Linux System Administration (uscs501)
2. Linux Practical (uscsp501)
3. Advanced Java (uscs502)
4. Advanced Java Practical (uscsp502)
5. Internet of Things (uscs503)
6. IoT Practical (uscsp503)
7. Advanced Web Technologies (uscs504)
8. Web Technologies Practical (uscsp504)

### Semester 6 (TY)
1. Artificial Intelligence (uscs601)
2. AI Practical (uscsp601)
3. Data Science (uscs602)
4. Data Science Practical (uscsp602)
5. Software Testing (uscs603)
6. Software Testing Practical (uscsp603)
7. Geographic Information Systems (uscs604)
8. GIS Practical (uscsp604)

## Quick Queries

### Get all subjects for a class
```python
client.get_subjects_by_class('9d9333f5-8377-48a8-8731-1b0351055075')
```

### SQL: Get subjects by class
```sql
SELECT * FROM subjects 
WHERE class_id = '9d9333f5-8377-48a8-8731-1b0351055075'
AND deleted_at IS NULL;
```

### Count subjects per class
```sql
SELECT c.name, COUNT(s.id) as count
FROM classes c
LEFT JOIN subjects s ON c.id = s.class_id AND s.deleted_at IS NULL
WHERE c.branch_id = '3c9c6aae-0de2-4954-bba5-c51108c7c8ef'
GROUP BY c.name;
```

## Verification Command
```bash
cd Face_Reco
python database/migrations/verify_bsc_cs_subjects.py
```

## Migration Info
- **Name:** add_bsc_cs_subjects_mumbai_university
- **Version:** 20260308124218
- **Date:** March 8, 2026
- **Status:** Applied ✅
