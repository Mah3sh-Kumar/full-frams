"""
Add BSc Computer Science subjects according to Mumbai University syllabus
Inserts subjects for FY, SY, and TY BSc CS (Semesters 1-6)
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from database.client import SupabaseClient
from datetime import datetime

# Class IDs from database
FYBSC_CS_ID = "9d9333f5-8377-48a8-8731-1b0351055075"  # F.Y. B.Sc. (Computer Science)
SYBSC_CS_ID = "eb53a436-2a8f-4ed3-917e-869ae3ccb6bb"  # S.Y. B.Sc. (Computer Science)
TYBSC_CS_ID = "b95d0610-4ebb-46eb-9dd9-63cf0ecdd6e1"  # T.Y. B.Sc. (Computer Science)

# Academic Year ID
ACADEMIC_YEAR_2025_26 = "48cc1693-1fa1-4a52-beaa-efb0642e68dc"

# Admin user ID for created_by
ADMIN_USER_ID = "3274455c-9b64-4b96-acf8-e14ec0713710"

# Branch ID for Computer Science
CS_BRANCH_ID = "3c9c6aae-0de2-4954-bba5-c51108c7c8ef"

# Mumbai University BSc Computer Science Syllabus
# Structure: (name, code, semester, class_id, subject_type)
BSC_CS_SUBJECTS = [
    # First Year - Semester 1
    ("Programming in C", "uscs101", 1, FYBSC_CS_ID, "theory"),
    ("Programming in C Practical", "uscsp101", 1, FYBSC_CS_ID, "practical"),
    ("Database Systems", "uscs102", 1, FYBSC_CS_ID, "theory"),
    ("Database Systems Practical", "uscsp102", 1, FYBSC_CS_ID, "practical"),
    ("Discrete Mathematics", "uscs103", 1, FYBSC_CS_ID, "theory"),
    ("Descriptive Statistics and Probability", "uscs104", 1, FYBSC_CS_ID, "theory"),
    
    # First Year - Semester 2
    ("Object Oriented Programming with C++", "uscs201", 2, FYBSC_CS_ID, "theory"),
    ("Object Oriented Programming with C++ Practical", "uscsp201", 2, FYBSC_CS_ID, "practical"),
    ("Data Structures", "uscs202", 2, FYBSC_CS_ID, "theory"),
    ("Data Structures Practical", "uscsp202", 2, FYBSC_CS_ID, "practical"),
    ("Computer Organization and Architecture", "uscs203", 2, FYBSC_CS_ID, "theory"),
    ("Numerical and Statistical Methods", "uscs204", 2, FYBSC_CS_ID, "theory"),
    
    # Second Year - Semester 3
    ("Python Programming", "uscs301", 3, SYBSC_CS_ID, "theory"),
    ("Python Programming Practical", "uscsp301", 3, SYBSC_CS_ID, "practical"),
    ("Data Communication and Computer Networks", "uscs302", 3, SYBSC_CS_ID, "theory"),
    ("Data Communication and Computer Networks Practical", "uscsp302", 3, SYBSC_CS_ID, "practical"),
    ("Operating Systems", "uscs303", 3, SYBSC_CS_ID, "theory"),
    ("Operating Systems Practical", "uscsp303", 3, SYBSC_CS_ID, "practical"),
    ("Microprocessor Architecture", "uscs304", 3, SYBSC_CS_ID, "theory"),
    
    # Second Year - Semester 4
    ("Core Java", "uscs401", 4, SYBSC_CS_ID, "theory"),
    ("Core Java Practical", "uscsp401", 4, SYBSC_CS_ID, "practical"),
    ("Introduction to Embedded Systems", "uscs402", 4, SYBSC_CS_ID, "theory"),
    ("Introduction to Embedded Systems Practical", "uscsp402", 4, SYBSC_CS_ID, "practical"),
    ("Computer Graphics and Animation", "uscs403", 4, SYBSC_CS_ID, "theory"),
    ("Computer Graphics and Animation Practical", "uscsp403", 4, SYBSC_CS_ID, "practical"),
    ("Software Engineering", "uscs404", 4, SYBSC_CS_ID, "theory"),
    
    # Third Year - Semester 5
    ("Linux System Administration", "uscs501", 5, TYBSC_CS_ID, "theory"),
    ("Linux System Administration Practical", "uscsp501", 5, TYBSC_CS_ID, "practical"),
    ("Advanced Java", "uscs502", 5, TYBSC_CS_ID, "theory"),
    ("Advanced Java Practical", "uscsp502", 5, TYBSC_CS_ID, "practical"),
    ("Internet of Things", "uscs503", 5, TYBSC_CS_ID, "theory"),
    ("Internet of Things Practical", "uscsp503", 5, TYBSC_CS_ID, "practical"),
    ("Advanced Web Technologies", "uscs504", 5, TYBSC_CS_ID, "theory"),
    ("Advanced Web Technologies Practical", "uscsp504", 5, TYBSC_CS_ID, "practical"),
    
    # Third Year - Semester 6
    ("Artificial Intelligence", "uscs601", 6, TYBSC_CS_ID, "theory"),
    ("Artificial Intelligence Practical", "uscsp601", 6, TYBSC_CS_ID, "practical"),
    ("Data Science", "uscs602", 6, TYBSC_CS_ID, "theory"),
    ("Data Science Practical", "uscsp602", 6, TYBSC_CS_ID, "practical"),
    ("Software Testing", "uscs603", 6, TYBSC_CS_ID, "theory"),
    ("Software Testing Practical", "uscsp603", 6, TYBSC_CS_ID, "practical"),
    ("Geographic Information Systems", "uscs604", 6, TYBSC_CS_ID, "theory"),
    ("Geographic Information Systems Practical", "uscsp604", 6, TYBSC_CS_ID, "practical"),
]


def check_existing_subjects(client: SupabaseClient):
    """Check if subjects already exist"""
    print("\n=== Checking for existing subjects ===")
    
    for class_id, class_name in [
        (FYBSC_CS_ID, "F.Y. B.Sc. CS"),
        (SYBSC_CS_ID, "S.Y. B.Sc. CS"),
        (TYBSC_CS_ID, "T.Y. B.Sc. CS")
    ]:
        result = client.client.table('subjects').select('id, name, code').eq(
            'class_id', class_id
        ).is_('deleted_at', 'null').execute()
        
        print(f"\n{class_name}: {len(result.data)} existing subjects")
        if result.data:
            for subj in result.data[:3]:
                print(f"  - {subj['name']} ({subj['code']})")
            if len(result.data) > 3:
                print(f"  ... and {len(result.data) - 3} more")


def insert_subjects(client: SupabaseClient, dry_run=False):
    """Insert BSc CS subjects into the database"""
    print("\n=== Inserting BSc Computer Science Subjects ===")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"Total subjects to insert: {len(BSC_CS_SUBJECTS)}")
    
    inserted_count = 0
    skipped_count = 0
    error_count = 0
    
    for name, code, semester, class_id, subject_type in BSC_CS_SUBJECTS:
        try:
            # Check if subject already exists
            existing = client.client.table('subjects').select('id, name').eq(
                'code', code
            ).eq('class_id', class_id).is_('deleted_at', 'null').execute()
            
            if existing.data:
                print(f"⊘ SKIP: {name} ({code}) - already exists")
                skipped_count += 1
                continue
            
            if dry_run:
                print(f"✓ WOULD INSERT: {name} ({code}) - Sem {semester} - {subject_type}")
                inserted_count += 1
            else:
                # Insert subject
                subject_data = {
                    "name": name,
                    "code": code,
                    "class_id": class_id,
                    "academic_year_id": ACADEMIC_YEAR_2025_26,
                    "is_active": True,
                    "created_by": ADMIN_USER_ID,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                result = client.client.table('subjects').insert(subject_data).execute()
                
                if result.data:
                    print(f"✓ INSERTED: {name} ({code}) - Sem {semester} - {subject_type}")
                    inserted_count += 1
                else:
                    print(f"✗ FAILED: {name} ({code})")
                    error_count += 1
                    
        except Exception as e:
            print(f"✗ ERROR: {name} ({code}) - {str(e)}")
            error_count += 1
    
    print(f"\n=== Summary ===")
    print(f"Inserted: {inserted_count}")
    print(f"Skipped: {skipped_count}")
    print(f"Errors: {error_count}")
    print(f"Total: {len(BSC_CS_SUBJECTS)}")
    
    return inserted_count, skipped_count, error_count


def verify_hierarchy(client: SupabaseClient):
    """Verify the department → branch → class → subject hierarchy"""
    print("\n=== Verifying Hierarchy ===")
    
    # Test query: Get subjects with full hierarchy
    query = """
    SELECT 
        s.id as subject_id,
        s.name as subject_name,
        s.code as subject_code,
        c.id as class_id,
        c.name as class_name,
        b.id as branch_id,
        b.name as branch_name,
        d.id as department_id,
        d.name as department_name
    FROM subjects s
    JOIN classes c ON s.class_id = c.id
    JOIN branches b ON c.branch_id = b.id
    JOIN org_departments d ON b.department_id = d.id
    WHERE c.id IN (
        '9d9333f5-8377-48a8-8731-1b0351055075',
        'eb53a436-2a8f-4ed3-917e-869ae3ccb6bb',
        'b95d0610-4ebb-46eb-9dd9-63cf0ecdd6e1'
    )
    AND s.deleted_at IS NULL
    ORDER BY c.name, s.name
    LIMIT 5;
    """
    
    result = client.client.rpc('exec_sql', {'query': query}).execute()
    
    if hasattr(result, 'data') and result.data:
        print("\n✓ Hierarchy verification successful!")
        print("\nSample records:")
        for row in result.data[:3]:
            print(f"\nDepartment: {row.get('department_name')}")
            print(f"  → Branch: {row.get('branch_name')}")
            print(f"    → Class: {row.get('class_name')}")
            print(f"      → Subject: {row.get('subject_name')} ({row.get('subject_code')})")
    else:
        print("⚠ No data returned from hierarchy query")


def main():
    """Main execution function"""
    print("=" * 60)
    print("BSc Computer Science Subject Migration")
    print("Mumbai University Syllabus (Semesters 1-6)")
    print("=" * 60)
    
    try:
        # Initialize client
        client = SupabaseClient()
        print("✓ Database connection established")
        
        # Check existing subjects
        check_existing_subjects(client)
        
        # Ask for confirmation
        print("\n" + "=" * 60)
        response = input("\nProceed with insertion? (yes/no/dry-run): ").strip().lower()
        
        if response == "dry-run":
            insert_subjects(client, dry_run=True)
        elif response == "yes":
            insert_subjects(client, dry_run=False)
            
            # Verify hierarchy after insertion
            verify_hierarchy(client)
            
            # Show final count
            check_existing_subjects(client)
        else:
            print("\n✗ Operation cancelled")
            return
        
        print("\n✓ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n✗ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
