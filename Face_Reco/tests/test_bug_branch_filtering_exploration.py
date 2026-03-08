"""
Bug Condition Exploration Test: Branch Filtering Returns All Branches with Duplicates

This test is designed to FAIL on unfixed code to confirm the bug exists.
The bug: get_branches_by_department() ignores department_id and returns all branches.

**Validates: Requirements 1.2, 2.2**

Expected behavior: get_branches_by_department(dept_id) should return only branches for that department
Actual behavior (unfixed): Returns all 52 branches, ignoring the department_id parameter
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.face_registration_service import FaceRegistrationService


def test_branch_filtering_by_department():
    """
    Bug Condition Exploration: Test that get_branches_by_department() filters correctly
    
    This test encodes the EXPECTED behavior (filtered branches only).
    On unfixed code, this test SHOULD FAIL, confirming the bug exists.
    After the fix, this test will pass, confirming the fix works.
    
    **Validates: Requirements 1.2, 2.2**
    """
    print("\n" + "="*70)
    print("Bug Condition Exploration Test: Branch Filtering by Department")
    print("="*70)
    
    # Initialize service
    service = FaceRegistrationService()
    
    # Step 1: Get all departments to find one to test with
    print("\n1. Getting all departments...")
    departments = service.get_departments()
    print(f"   Found {len(departments)} departments")
    
    if not departments:
        print("   ✗ Error: No departments found in database")
        raise Exception("Cannot run test without departments")
    
    # Select first department for testing (typically Computer Science)
    test_department = departments[0]
    dept_id = test_department['id']
    dept_name = test_department.get('name', 'Unknown')
    print(f"   Testing with department: {dept_name} (ID: {dept_id})")
    
    # Step 2: Get all branches to establish baseline
    print("\n2. Getting all branches (baseline)...")
    try:
        # Query all branches directly to know total count
        all_branches_response = service.db.client.table('branches').select(
            'id, name, code, class_id, is_active'
        ).eq('is_active', True).execute()
        total_branches = len(all_branches_response.data)
        print(f"   Total branches in database: {total_branches}")
    except Exception as e:
        print(f"   ✗ Error querying all branches: {e}")
        # According to bug description, there are 52 branches
        total_branches = 52
        print(f"   Using known total from bug description: {total_branches}")
    
    # Step 3: Determine expected branch count for the test department
    # According to the bug description, Computer Science has 3 branches
    # We'll use a heuristic: if we're testing Computer Science, expect 3 branches
    # Otherwise, expect fewer branches than the total
    expected_branch_count = 3  # Known from bug description for Computer Science
    print(f"   Expected branches for {dept_name}: {expected_branch_count}")
    print(f"   (Based on bug description: Computer Science has 3 branches)")
    
    # Step 4: Call the buggy method
    print(f"\n3. Testing get_branches_by_department('{dept_id}')...")
    result = service.get_branches_by_department(dept_id)
    result_count = len(result)
    print(f"   Method returned {result_count} branches")
    
    # Step 5: Check for duplicates
    print("\n4. Checking for duplicate branch IDs...")
    branch_ids = [branch['id'] for branch in result]
    unique_branch_ids = set(branch_ids)
    duplicate_count = len(branch_ids) - len(unique_branch_ids)
    
    if duplicate_count > 0:
        print(f"   ✗ Found {duplicate_count} duplicate branch IDs")
        print(f"   Total branches: {result_count}, Unique branches: {len(unique_branch_ids)}")
    else:
        print(f"   ✓ No duplicates found (all {result_count} branches are unique)")
    
    # Step 6: Document the counterexample
    print("\n5. Bug Condition Analysis:")
    print(f"   Department: {dept_name} (ID: {dept_id})")
    print(f"   Expected branches: {expected_branch_count}")
    print(f"   Actual branches returned: {result_count}")
    print(f"   Total branches in database: {total_branches}")
    print(f"   Duplicate branch IDs: {duplicate_count}")
    
    if result_count == total_branches:
        print("\n   ✗ BUG CONFIRMED!")
        print(f"   Counterexample: get_branches_by_department('{dept_id}') returns all {total_branches} branches")
        print(f"   Expected: Should return only {expected_branch_count} branches for {dept_name}")
        print("   Root cause: Method ignores department_id parameter and returns all branches")
        print("\n   This is the EXPECTED FAILURE for bug exploration.")
        print("   After fixing the code, this test should pass.")
    elif result_count == expected_branch_count and duplicate_count == 0:
        print("\n   ✓ Method returned correct number of branches without duplicates")
        print("   Bug may already be fixed, or root cause analysis is incorrect.")
    else:
        print(f"\n   ⚠ UNEXPECTED: Method returned {result_count} branches")
        print(f"   Expected either {expected_branch_count} (fixed) or {total_branches} (unfixed)")
    
    # Step 7: Assert the expected behavior (this will fail on unfixed code)
    print("\n6. Assertion Checks:")
    failures = []
    
    # Check 1: Result count should match expected for department
    try:
        assert result_count == expected_branch_count, \
            f"Expected {expected_branch_count} branches for {dept_name}, got {result_count}"
        print(f"   ✓ PASS: Branch count matches expected ({expected_branch_count})")
    except AssertionError as e:
        print(f"   ✗ FAIL: {e}")
        failures.append(str(e))
    
    # Check 2: No duplicate branch IDs
    try:
        assert duplicate_count == 0, \
            f"Found {duplicate_count} duplicate branch IDs in result"
        print(f"   ✓ PASS: No duplicate branch IDs")
    except AssertionError as e:
        print(f"   ✗ FAIL: {e}")
        failures.append(str(e))
    
    # Check 3: Should not return all branches
    try:
        assert result_count < total_branches, \
            f"Method returned all {total_branches} branches instead of filtering by department"
        print(f"   ✓ PASS: Result is filtered (not all branches)")
    except AssertionError as e:
        print(f"   ✗ FAIL: {e}")
        failures.append(str(e))
    
    if failures:
        print("\n" + "="*70)
        print("TEST RESULT: FAILED (Bug Confirmed)")
        print("="*70)
        print(f"\nCounterexample documented:")
        print(f"  get_branches_by_department('{dept_id}') returns {result_count} branches instead of {expected_branch_count}")
        print(f"  Duplicates: {duplicate_count}")
        raise AssertionError(f"{len(failures)} assertion(s) failed: " + "; ".join(failures))
    
    print("\n" + "="*70)
    print("TEST RESULT: PASSED (Bug Fixed or Not Present)")
    print("="*70)


if __name__ == '__main__':
    try:
        test_branch_filtering_by_department()
    except AssertionError:
        # Expected failure on unfixed code
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
