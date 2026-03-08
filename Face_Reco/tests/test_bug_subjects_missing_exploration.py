"""
Bug Condition Exploration Test: All Active Classes Have Subjects

This test is designed to FAIL on unfixed database to confirm the bug exists.
The bug: Most classes lack subject assignments in the database (only F.Y. B.Sc. has subjects).

**Validates: Requirements 1.3, 2.3, 2.5**

Expected behavior: All active classes should have at least one subject assigned
Actual behavior (unfixed): Most classes return 0 subjects when queried
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.client import SupabaseClient


def test_all_active_classes_have_subjects():
    """
    Bug Condition Exploration: Test that all active classes have subjects
    
    This test encodes the EXPECTED behavior (all classes have subjects).
    On unfixed database, this test SHOULD FAIL, confirming subjects are missing.
    After the migration script populates the data, this test will pass.
    
    **Validates: Requirements 1.3, 2.3, 2.5**
    """
    print("\n" + "="*70)
    print("Bug Condition Exploration Test: All Active Classes Have Subjects")
    print("="*70)
    
    # Initialize database client
    db = SupabaseClient()
    
    # Step 1: Query all active classes
    print("\n1. Querying all active classes...")
    try:
        classes_response = db.client.table('classes').select(
            'id, name, academic_year, is_active'
        ).eq('is_active', True).execute()
        classes = classes_response.data
        total_classes = len(classes)
        print(f"   Found {total_classes} active class(es) in database")
        if total_classes > 0:
            print("   Classes:")
            for cls in classes:
                print(f"     - {cls['name']} (ID: {cls['id']}, Year: {cls.get('academic_year', 'N/A')})")
    except Exception as e:
        print(f"   ✗ Error querying classes: {e}")
        raise
    
    if total_classes == 0:
        print("   ⚠ No active classes found. Cannot run test.")
        raise Exception("No active classes found in database")
    
    # Step 2: For each class, query subjects
    print("\n2. Querying subjects for each class...")
    classes_with_subjects = []
    classes_without_subjects = []
    subject_counts = {}
    
    for cls in classes:
        class_id = cls['id']
        class_name = cls['name']
        
        try:
            subjects_response = db.client.table('subjects').select(
                'id, name, code, is_active'
            ).eq('class_id', class_id).execute()
            subjects = subjects_response.data
            subject_count = len(subjects)
            subject_counts[class_name] = subject_count
            
            if subject_count > 0:
                classes_with_subjects.append(cls)
                print(f"   ✓ {class_name}: {subject_count} subject(s)")
                for subject in subjects[:3]:  # Show first 3 subjects
                    print(f"       - {subject['name']} ({subject.get('code', 'N/A')})")
                if subject_count > 3:
                    print(f"       ... and {subject_count - 3} more")
            else:
                classes_without_subjects.append(cls)
                print(f"   ✗ {class_name}: 0 subjects (MISSING DATA)")
        except Exception as e:
            print(f"   ✗ Error querying subjects for {class_name}: {e}")
            classes_without_subjects.append(cls)
            subject_counts[class_name] = 0
    
    # Step 3: Document the counterexample
    print("\n3. Bug Condition Analysis:")
    print(f"   Total active classes: {total_classes}")
    print(f"   Classes with subjects: {len(classes_with_subjects)}")
    print(f"   Classes without subjects: {len(classes_without_subjects)}")
    
    if classes_without_subjects:
        print("\n   Classes missing subject data:")
        for cls in classes_without_subjects:
            print(f"     - {cls['name']} (ID: {cls['id']})")
    
    if classes_with_subjects:
        print("\n   Classes with subject data:")
        for cls in classes_with_subjects:
            class_name = cls['name']
            count = subject_counts.get(class_name, 0)
            print(f"     - {class_name}: {count} subject(s)")
    
    # Identify the counterexample
    if classes_without_subjects:
        print("\n   ✗ BUG CONFIRMED!")
        example_class = classes_without_subjects[0]
        print(f"   Counterexample: Query for subjects in '{example_class['name']}' class returns empty list")
        print(f"   Data integrity issue: {len(classes_without_subjects)} out of {total_classes} classes lack subject assignments")
        print("   Root cause: Database was not properly seeded with subject data for most classes")
        print("\n   This is the EXPECTED FAILURE for bug exploration.")
        print("   After running the migration script, this test should pass.")
    else:
        print("\n   ✓ All classes have subjects assigned")
        print("   Bug may already be fixed, or migration has already been run.")
    
    # Step 4: Assert the expected behavior (this will fail on unfixed database)
    print("\n4. Assertion Checks:")
    failures = []
    
    # Check 1: All classes should have at least one subject
    for cls in classes:
        class_name = cls['name']
        subject_count = subject_counts.get(class_name, 0)
        
        try:
            assert subject_count > 0, \
                f"Class '{class_name}' has 0 subjects assigned"
            print(f"   ✓ PASS: {class_name} has {subject_count} subject(s)")
        except AssertionError as e:
            print(f"   ✗ FAIL: {e}")
            failures.append(str(e))
    
    # Check 2: Overall data integrity - no classes should be without subjects
    try:
        assert len(classes_without_subjects) == 0, \
            f"{len(classes_without_subjects)} out of {total_classes} classes lack subject assignments"
        print(f"   ✓ PASS: All {total_classes} classes have subjects assigned")
    except AssertionError as e:
        print(f"   ✗ FAIL: {e}")
        failures.append(str(e))
    
    if failures:
        print("\n" + "="*70)
        print("TEST RESULT: FAILED (Bug Confirmed)")
        print("="*70)
        print(f"\nCounterexample documented:")
        if classes_without_subjects:
            example_class = classes_without_subjects[0]
            print(f"  Query for subjects in '{example_class['name']}' class returns empty list")
        print(f"  {len(classes_without_subjects)} out of {total_classes} classes lack subject assignments")
        raise AssertionError(f"{len(failures)} assertion(s) failed: " + "; ".join(failures))
    
    print("\n" + "="*70)
    print("TEST RESULT: PASSED (Bug Fixed or Not Present)")
    print("="*70)


if __name__ == '__main__':
    try:
        test_all_active_classes_have_subjects()
    except AssertionError:
        # Expected failure on unfixed database
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
