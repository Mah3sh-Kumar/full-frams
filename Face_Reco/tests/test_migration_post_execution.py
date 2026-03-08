"""
Post-Migration Validation Tests

This test file validates the database state AFTER the migration has been run.
It assumes the migration script has been executed with proper credentials.

These tests verify:
- Academic year 2025-2026 exists
- All classes have subjects
- Data integrity is maintained
- No duplicate data exists

Requirements: 2.3, 2.4, 2.5
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.client import SupabaseClient


def test_migration_results():
    """
    Validate the database state after migration execution.
    
    This test should be run AFTER the migration script has been executed
    with proper service role credentials.
    """
    print("\n" + "="*70)
    print("POST-MIGRATION VALIDATION TEST")
    print("="*70)
    print("\nThis test validates the database state after migration execution.")
    print("Run this AFTER executing: python -m database.migrations.populate_missing_data")
    print("="*70)
    
    db = SupabaseClient()
    all_passed = True
    
    # Test 1: Academic year 2025-2026 exists
    print("\n[TEST 1] Verifying academic year 2025-2026 exists...")
    try:
        ay_result = db.client.table('academic_years').select(
            'id, name, start_date, end_date, is_current'
        ).eq('name', '2025-2026').execute()
        
        if ay_result.data:
            ay = ay_result.data[0]
            print(f"✓ Academic year 2025-2026 found")
            print(f"  - ID: {ay['id']}")
            print(f"  - Start: {ay['start_date']}")
            print(f"  - End: {ay['end_date']}")
            print(f"  - Is Current: {ay['is_current']}")
        else:
            print("✗ Academic year 2025-2026 NOT FOUND")
            print("  Migration may not have been run yet or failed")
            all_passed = False
    except Exception as e:
        print(f"✗ Error checking academic year: {e}")
        all_passed = False
    
    # Test 2: All classes have subjects
    print("\n[TEST 2] Verifying all classes have subjects...")
    try:
        classes = db.client.table('classes').select(
            'id, name, academic_year'
        ).eq('is_active', True).execute()
        
        print(f"Found {len(classes.data)} active classes")
        
        classes_without_subjects = []
        total_subjects = 0
        
        for cls in classes.data:
            subjects = db.client.table('subjects').select('id').eq(
                'class_id', cls['id']
            ).eq('is_active', True).execute()
            
            subject_count = len(subjects.data)
            total_subjects += subject_count
            
            if subject_count == 0:
                classes_without_subjects.append(cls['name'])
                print(f"  ✗ {cls['name']}: No subjects")
            else:
                print(f"  ✓ {cls['name']}: {subject_count} subjects")
        
        if classes_without_subjects:
            print(f"\n✗ {len(classes_without_subjects)} classes without subjects")
            print(f"  Classes: {', '.join(classes_without_subjects)}")
            all_passed = False
        else:
            print(f"\n✓ All {len(classes.data)} classes have subjects")
            print(f"  Total subjects in database: {total_subjects}")
    except Exception as e:
        print(f"✗ Error checking subjects: {e}")
        all_passed = False
    
    # Test 3: No invalid academic year references
    print("\n[TEST 3] Verifying all academic year references are valid...")
    try:
        classes = db.client.table('classes').select('id, name, academic_year').execute()
        academic_years = db.client.table('academic_years').select('name').execute()
        year_names = {ay['name'] for ay in academic_years.data}
        
        print(f"Valid academic years: {', '.join(sorted(year_names))}")
        
        invalid_refs = []
        for cls in classes.data:
            if cls['academic_year'] not in year_names:
                invalid_refs.append(f"{cls['name']} -> {cls['academic_year']}")
        
        if invalid_refs:
            print(f"✗ {len(invalid_refs)} classes with invalid academic year references:")
            for ref in invalid_refs:
                print(f"  - {ref}")
            all_passed = False
        else:
            print(f"✓ All {len(classes.data)} classes have valid academic year references")
    except Exception as e:
        print(f"✗ Error checking academic year references: {e}")
        all_passed = False
    
    # Test 4: Check for duplicate academic years
    print("\n[TEST 4] Checking for duplicate academic years...")
    try:
        ay_result = db.client.table('academic_years').select('name').execute()
        ay_names = [ay['name'] for ay in ay_result.data]
        
        duplicates = [name for name in set(ay_names) if ay_names.count(name) > 1]
        
        if duplicates:
            print(f"✗ Found duplicate academic years: {', '.join(duplicates)}")
            all_passed = False
        else:
            print(f"✓ No duplicate academic years (found {len(ay_names)} unique years)")
    except Exception as e:
        print(f"✗ Error checking duplicates: {e}")
        all_passed = False
    
    # Test 5: Verify is_current flag is set correctly
    print("\n[TEST 5] Verifying is_current flag...")
    try:
        current_years = db.client.table('academic_years').select(
            'name'
        ).eq('is_current', True).execute()
        
        if len(current_years.data) == 0:
            print("✗ No academic year marked as current")
            all_passed = False
        elif len(current_years.data) > 1:
            print(f"✗ Multiple academic years marked as current: {[y['name'] for y in current_years.data]}")
            all_passed = False
        else:
            print(f"✓ Exactly one academic year marked as current: {current_years.data[0]['name']}")
    except Exception as e:
        print(f"✗ Error checking is_current flag: {e}")
        all_passed = False
    
    # Summary
    print("\n" + "="*70)
    if all_passed:
        print("✓ ALL POST-MIGRATION VALIDATION TESTS PASSED")
        print("\nThe migration was successful and the database is in a valid state.")
    else:
        print("✗ SOME POST-MIGRATION VALIDATION TESTS FAILED")
        print("\nThe migration may not have been run yet, or there are data integrity issues.")
        print("\nTo run the migration:")
        print("  python -m database.migrations.populate_missing_data")
    print("="*70)
    
    return all_passed


if __name__ == '__main__':
    success = test_migration_results()
    sys.exit(0 if success else 1)
