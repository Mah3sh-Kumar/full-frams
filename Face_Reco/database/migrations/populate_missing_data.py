"""
Database Migration: Populate Missing Academic Year and Subject Data
Run this script once to fix data integrity issues
"""
from database.client import SupabaseClient
from datetime import datetime, date
import sys


def populate_academic_years(db: SupabaseClient):
    """Add missing academic year 2025-2026"""
    print("Checking academic years...")
    
    # Check if 2025-2026 exists
    existing = db.client.table('academic_years').select('id').eq('name', '2025-2026').execute()
    
    if existing.data:
        print("✓ Academic year 2025-2026 already exists")
        return True
    
    # Insert 2025-2026
    print("Adding academic year 2025-2026...")
    try:
        result = db.client.table('academic_years').insert({
            'name': '2025-2026',
            'start_date': '2025-06-01',
            'end_date': '2026-05-31',
            'is_current': True
        }).execute()
        
        # Update 2024-2025 to not current
        db.client.table('academic_years').update({
            'is_current': False
        }).eq('name', '2024-2025').execute()
        
        print("✓ Academic year 2025-2026 added successfully")
        return True
    except Exception as e:
        print(f"✗ Error adding academic year: {e}")
        return False


def populate_subjects(db: SupabaseClient):
    """Add subjects for classes that don't have any"""
    print("\nChecking subjects for all classes...")
    
    # Get all classes
    classes = db.client.table('classes').select('id, name, academic_year').eq('is_active', True).execute()
    
    if not classes.data:
        print("✗ No classes found")
        return False
    
    # Get academic year IDs
    academic_years = db.client.table('academic_years').select('id, name').execute()
    academic_year_map = {ay['name']: ay['id'] for ay in academic_years.data}
    
    # Get a system user ID for created_by (use first admin/teacher user)
    users = db.client.table('users').select('id').eq('role', 'admin').limit(1).execute()
    if not users.data:
        # Try teacher if no admin found
        users = db.client.table('users').select('id').eq('role', 'teacher').limit(1).execute()
    if not users.data:
        print("✗ No admin or teacher user found for created_by field")
        return False
    created_by_user_id = users.data[0]['id']
    
    # Subject templates by class level
    subject_templates = {
        'F.Y.': ['Mathematics I', 'Physics I', 'Chemistry I', 'English', 'Environmental Science'],
        'S.Y.': ['Mathematics II', 'Physics II', 'Chemistry II', 'Computer Science', 'Statistics'],
        'T.Y.': ['Mathematics III', 'Physics III', 'Chemistry III', 'Project Work', 'Elective']
    }
    
    success_count = 0
    skip_count = 0
    
    for cls in classes.data:
        class_id = cls['id']
        class_name = cls['name']
        class_academic_year = cls['academic_year']
        
        # Get academic_year_id for this class
        academic_year_id = academic_year_map.get(class_academic_year)
        if not academic_year_id:
            print(f"  ⚠ {class_name}: Academic year '{class_academic_year}' not found in academic_years table")
            continue
        
        # Check if class already has subjects
        existing_subjects = db.client.table('subjects').select('id').eq('class_id', class_id).execute()
        
        if existing_subjects.data:
            print(f"  ✓ {class_name}: Already has {len(existing_subjects.data)} subjects")
            skip_count += 1
            continue
        
        # Determine subject template based on class name
        template_key = None
        for key in subject_templates.keys():
            if key in class_name:
                template_key = key
                break
        
        if not template_key:
            print(f"  ⚠ {class_name}: No template found, using default subjects")
            template_key = 'F.Y.'  # Default
        
        # Insert subjects
        subjects_to_insert = []
        for i, subject_name in enumerate(subject_templates[template_key]):
            subjects_to_insert.append({
                'name': subject_name,
                'code': f"{template_key.replace('.', '')}{i+1:02d}",
                'class_id': class_id,
                'academic_year_id': academic_year_id,
                'created_by': created_by_user_id,
                'is_active': True
            })
        
        try:
            result = db.client.table('subjects').insert(subjects_to_insert).execute()
            print(f"  ✓ {class_name}: Added {len(subjects_to_insert)} subjects")
            success_count += 1
        except Exception as e:
            print(f"  ✗ {class_name}: Error adding subjects - {e}")
    
    print(f"\nSummary: {success_count} classes updated, {skip_count} classes skipped")
    return success_count > 0 or skip_count > 0


def validate_data(db: SupabaseClient):
    """Validate data integrity after migration"""
    print("\nValidating data integrity...")
    
    issues = []
    
    # Check 1: All classes have matching academic years
    classes = db.client.table('classes').select('id, name, academic_year').execute()
    academic_years = db.client.table('academic_years').select('name').execute()
    year_names = {ay['name'] for ay in academic_years.data}
    
    for cls in classes.data:
        if cls['academic_year'] not in year_names:
            issues.append(f"Class '{cls['name']}' references non-existent academic year '{cls['academic_year']}'")
    
    # Check 2: All active classes have subjects
    for cls in classes.data:
        subjects = db.client.table('subjects').select('id').eq('class_id', cls['id']).execute()
        if not subjects.data:
            issues.append(f"Class '{cls['name']}' has no subjects assigned")
    
    if issues:
        print("✗ Data integrity issues found:")
        for issue in issues:
            print(f"  - {issue}")
        return False
    else:
        print("✓ All data integrity checks passed")
        return True


def main():
    """Run the migration"""
    print("=" * 60)
    print("Database Migration: Populate Missing Data")
    print("=" * 60)
    
    try:
        db = SupabaseClient()
        
        # Step 1: Populate academic years
        if not populate_academic_years(db):
            print("\n✗ Migration failed at academic years step")
            sys.exit(1)
        
        # Step 2: Populate subjects
        if not populate_subjects(db):
            print("\n✗ Migration failed at subjects step")
            sys.exit(1)
        
        # Step 3: Validate
        if not validate_data(db):
            print("\n⚠ Migration completed but data integrity issues remain")
            sys.exit(1)
        
        print("\n" + "=" * 60)
        print("✓ Migration completed successfully")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Migration failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
