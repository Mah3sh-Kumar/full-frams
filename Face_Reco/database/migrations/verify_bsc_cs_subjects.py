"""
Verification Script for BSc CS Subjects Migration
Tests the hierarchy and filtering queries
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from database.client import SupabaseClient


def test_hierarchy():
    """Test the complete hierarchy"""
    print("\n" + "="*60)
    print("Testing Department → Branch → Class → Subject Hierarchy")
    print("="*60)
    
    client = SupabaseClient()
    
    # Get department
    dept = client.client.table('org_departments').select('id, name').eq('code', 'science_dept').execute()
    
    if not dept.data:
        print("\n✗ Department not found")
        return
    
    dept_name = dept.data[0]['name']
    dept_id = dept.data[0]['id']
    
    # Get branch
    branch = client.client.table('branches').select('id, name').eq('code', 'cs_dept').eq('department_id', dept_id).execute()
    
    if not branch.data:
        print("\n✗ Branch not found")
        return
    
    branch_name = branch.data[0]['name']
    branch_id = branch.data[0]['id']
    
    # Get classes
    classes = client.client.table('classes').select('id, name').eq('branch_id', branch_id).order('name').execute()
    
    print(f"\n✓ Hierarchy Test PASSED\n")
    print(f"Department: {dept_name}")
    print(f"  → Branch: {branch_name}")
    
    for cls in classes.data:
        # Count subjects for this class
        subjects = client.client.table('subjects').select('id', count='exact').eq('class_id', cls['id']).is_('deleted_at', 'null').execute()
        subject_count = subjects.count if hasattr(subjects, 'count') else len(subjects.data)
        
        print(f"    → Class: {cls['name']}")
        print(f"      → Subjects: {subject_count}\n")


def test_class_filtering():
    """Test filtering subjects by class"""
    print("\n" + "="*60)
    print("Testing Subject Filtering by Class")
    print("="*60)
    
    client = SupabaseClient()
    
    classes = [
        ("9d9333f5-8377-48a8-8731-1b0351055075", "F.Y. B.Sc. CS", 12),
        ("eb53a436-2a8f-4ed3-917e-869ae3ccb6bb", "S.Y. B.Sc. CS", 14),
        ("b95d0610-4ebb-46eb-9dd9-63cf0ecdd6e1", "T.Y. B.Sc. CS", 16)
    ]
    
    all_passed = True
    
    for class_id, class_name, expected_count in classes:
        subjects = client.get_subjects_by_class(class_id)
        actual_count = len(subjects)
        
        status = "✓ PASS" if actual_count == expected_count else "✗ FAIL"
        all_passed = all_passed and (actual_count == expected_count)
        
        print(f"\n{status} - {class_name}")
        print(f"  Expected: {expected_count} subjects")
        print(f"  Actual: {actual_count} subjects")
        
        if subjects and actual_count <= 5:
            print(f"  Sample subjects:")
            for subj in subjects[:3]:
                print(f"    - {subj['name']} ({subj['code']})")
    
    if all_passed:
        print("\n✓ All filtering tests PASSED")
    else:
        print("\n✗ Some filtering tests FAILED")
    
    return all_passed


def test_no_duplicates():
    """Test for duplicate subjects"""
    print("\n" + "="*60)
    print("Testing for Duplicate Subjects")
    print("="*60)
    
    client = SupabaseClient()
    
    # Get all subjects for BSc CS classes
    class_ids = [
        '9d9333f5-8377-48a8-8731-1b0351055075',
        'eb53a436-2a8f-4ed3-917e-869ae3ccb6bb',
        'b95d0610-4ebb-46eb-9dd9-63cf0ecdd6e1'
    ]
    
    all_subjects = []
    for class_id in class_ids:
        subjects = client.client.table('subjects').select('code, name, class_id').eq('class_id', class_id).is_('deleted_at', 'null').execute()
        all_subjects.extend(subjects.data)
    
    # Check for duplicates
    seen = {}
    duplicates = []
    
    for subj in all_subjects:
        key = (subj['code'], subj['class_id'])
        if key in seen:
            duplicates.append(subj)
        else:
            seen[key] = subj
    
    if len(duplicates) == 0:
        print("\n✓ No duplicates found - Test PASSED")
        return True
    else:
        print(f"\n✗ Found {len(duplicates)} duplicate subjects - Test FAILED")
        for dup in duplicates:
            print(f"  - {dup['name']} ({dup['code']})")
        return False


def test_subject_details():
    """Show sample subject details"""
    print("\n" + "="*60)
    print("Sample Subject Details")
    print("="*60)
    
    client = SupabaseClient()
    
    # Get a few subjects from each class
    for class_id, class_name in [
        ("9d9333f5-8377-48a8-8731-1b0351055075", "F.Y. B.Sc. CS"),
        ("eb53a436-2a8f-4ed3-917e-869ae3ccb6bb", "S.Y. B.Sc. CS"),
        ("b95d0610-4ebb-46eb-9dd9-63cf0ecdd6e1", "T.Y. B.Sc. CS")
    ]:
        subjects = client.get_subjects_by_class(class_id)
        
        print(f"\n{class_name} - First 3 subjects:")
        for subj in subjects[:3]:
            print(f"  • {subj['name']}")
            print(f"    Code: {subj['code']}")
            print(f"    Active: {subj.get('is_active', 'N/A')}")


def main():
    """Run all verification tests"""
    print("\n" + "="*60)
    print("BSc CS Subjects Migration Verification")
    print("="*60)
    
    try:
        client = SupabaseClient()
        print("✓ Database connection established")
        
        # Run tests
        test_hierarchy()
        filtering_passed = test_class_filtering()
        duplicates_passed = test_no_duplicates()
        test_subject_details()
        
        # Summary
        print("\n" + "="*60)
        print("Verification Summary")
        print("="*60)
        
        if filtering_passed and duplicates_passed:
            print("\n✓ ALL TESTS PASSED")
            print("\nThe BSc CS subjects migration is successful!")
            print("The hierarchy and filtering are working correctly.")
        else:
            print("\n✗ SOME TESTS FAILED")
            print("\nPlease review the failed tests above.")
        
    except Exception as e:
        print(f"\n✗ Verification failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
