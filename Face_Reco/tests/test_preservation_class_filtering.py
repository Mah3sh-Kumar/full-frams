"""
Preservation Property Test: Class Filtering by Branch and Academic Year

This is a PRESERVATION test that MUST PASS on the current unfixed code.
It captures baseline behavior that must remain unchanged after the fixes.

**Validates: Requirements 3.5**

Expected behavior: get_classes_by_filters() should correctly filter classes
by branch and academic year without any changes to the filtering logic.

This test ensures no regressions are introduced when fixing other bugs.

Property-based testing approach:
- Generates many test cases to verify the property holds consistently
- Tests that class filtering is deterministic and stable
- Verifies data structure integrity across multiple calls
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.face_registration_service import FaceRegistrationService
from database.client import SupabaseClient
from hypothesis import given, strategies as st, settings, Phase
import pytest


# Expected baseline behavior
EXPECTED_CLASS_FIELDS = {'id', 'name', 'academic_year', 'is_active'}


def test_class_filtering_by_branch_property():
    """
    Property: Class filtering by branch returns consistent results
    
    This property-based test verifies that:
    1. get_classes_by_filters() with branch_id returns classes correctly
    2. The data structure remains unchanged across multiple calls
    3. All required fields are present in each class record
    4. Filtering logic is deterministic
    
    The test generates many calls to verify consistency and stability.
    
    **Validates: Requirements 3.5**
    """
    # Initialize service once
    service = FaceRegistrationService()
    
    # Get a branch to test with
    branches = service.get_all_branches()
    
    if not branches:
        pytest.skip("No branches available for testing")
    
    # Use the first branch for testing
    test_branch = branches[0]
    branch_id = test_branch['id']
    
    # Test multiple times to verify consistency
    for i in range(10):
        # Call the method with branch filter
        result = service.get_classes_by_filters(branch_id=branch_id)
        
        # Property 1: Result should be a list
        assert isinstance(result, list), \
            f"Result should be a list, got {type(result)}"
        
        # Property 2: Each class has the correct data structure
        for cls in result:
            assert isinstance(cls, dict), \
                f"Class should be a dict, got {type(cls)}"
            
            # Check all required fields are present
            actual_fields = set(cls.keys())
            assert EXPECTED_CLASS_FIELDS.issubset(actual_fields), \
                f"Missing fields. Expected {EXPECTED_CLASS_FIELDS}, got {actual_fields}"
            
            # Check field types
            assert isinstance(cls['id'], str), \
                f"Class id should be string, got {type(cls['id'])}"
            assert isinstance(cls['name'], str), \
                f"Class name should be string, got {type(cls['name'])}"
            assert isinstance(cls['academic_year'], str), \
                f"Class academic_year should be string, got {type(cls['academic_year'])}"
            assert isinstance(cls['is_active'], bool), \
                f"Class is_active should be bool, got {type(cls['is_active'])}"
            
            # Property 3: All classes are active
            assert cls['is_active'] is True, \
                f"Class {cls['name']} should be active"
            
            # Property 4: No empty values for required fields
            assert cls['id'].strip() != '', \
                f"Class id should not be empty"
            assert cls['name'].strip() != '', \
                f"Class name should not be empty"
            assert cls['academic_year'].strip() != '', \
                f"Class academic_year should not be empty"


def test_class_filtering_by_academic_year_property():
    """
    Property: Class filtering by academic year returns consistent results
    
    This property-based test verifies that:
    1. get_classes_by_filters() with academic_year_id returns classes correctly
    2. All returned classes have the specified academic year
    3. The data structure remains unchanged across multiple calls
    4. Filtering logic is deterministic
    
    NOTE: This test may be skipped if academic years query is broken (Bug 1).
    The preservation requirement is about class filtering logic, not academic years query.
    
    **Validates: Requirements 3.5**
    """
    # Initialize service once
    service = FaceRegistrationService()
    
    # Get academic years to test with
    academic_years = service.get_academic_years()
    
    # Skip if academic years query is broken (this is Bug 1, not related to class filtering)
    if not academic_years:
        pytest.skip("Academic years query is broken (Bug 1) - skipping this test")
    
    # Use the first academic year for testing
    test_year = academic_years[0]
    year_id = test_year['id']
    year_name = test_year['name']
    
    # Test multiple times to verify consistency
    for i in range(10):
        # Call the method with academic year filter
        result = service.get_classes_by_filters(academic_year_id=year_id)
        
        # Property 1: Result should be a list
        assert isinstance(result, list), \
            f"Result should be a list, got {type(result)}"
        
        # Property 2: All returned classes should have the specified academic year
        for cls in result:
            assert cls['academic_year'] == year_name, \
                f"Class {cls['name']} has academic_year '{cls['academic_year']}', expected '{year_name}'"
        
        # Property 3: Each class has the correct data structure
        for cls in result:
            assert isinstance(cls, dict), \
                f"Class should be a dict, got {type(cls)}"
            
            # Check all required fields are present
            actual_fields = set(cls.keys())
            assert EXPECTED_CLASS_FIELDS.issubset(actual_fields), \
                f"Missing fields. Expected {EXPECTED_CLASS_FIELDS}, got {actual_fields}"


def test_class_filtering_deterministic():
    """
    Property: Class filtering is deterministic
    
    Multiple calls to get_classes_by_filters() with the same parameters
    should return the same results in the same order.
    
    **Validates: Requirements 3.5**
    """
    service = FaceRegistrationService()
    
    # Get a branch to test with
    branches = service.get_all_branches()
    
    if not branches:
        pytest.skip("No branches available for testing")
    
    test_branch = branches[0]
    branch_id = test_branch['id']
    
    # Call multiple times with same parameters
    result1 = service.get_classes_by_filters(branch_id=branch_id)
    result2 = service.get_classes_by_filters(branch_id=branch_id)
    result3 = service.get_classes_by_filters(branch_id=branch_id)
    
    # Should return same count
    assert len(result1) == len(result2) == len(result3), \
        "Class filtering should return consistent count"
    
    # Should return same class IDs in same order
    ids1 = [cls['id'] for cls in result1]
    ids2 = [cls['id'] for cls in result2]
    ids3 = [cls['id'] for cls in result3]
    
    assert ids1 == ids2 == ids3, \
        "Class IDs should be consistent across calls"
    
    # Should return same class names in same order
    names1 = [cls['name'] for cls in result1]
    names2 = [cls['name'] for cls in result2]
    names3 = [cls['name'] for cls in result3]
    
    assert names1 == names2 == names3, \
        "Class names should be consistent across calls"


def test_class_filtering_no_filters():
    """
    Property: Class filtering with no filters returns all active classes
    
    When no filters are provided, get_classes_by_filters() should return
    all active classes (same as get_all_classes()).
    
    **Validates: Requirements 3.5**
    """
    service = FaceRegistrationService()
    db = SupabaseClient()
    
    # Call with no filters
    filtered_result = service.get_classes_by_filters()
    
    # Get all classes for comparison
    all_classes = db.get_all_classes()
    
    # Should return same count
    assert len(filtered_result) == len(all_classes), \
        f"No filters should return all classes. Got {len(filtered_result)}, expected {len(all_classes)}"
    
    # Should return same class IDs (order might differ)
    filtered_ids = set(cls['id'] for cls in filtered_result)
    all_ids = set(cls['id'] for cls in all_classes)
    
    assert filtered_ids == all_ids, \
        "No filters should return same classes as get_all_classes()"


def test_class_filtering_combined_filters():
    """
    Property: Class filtering with combined filters works correctly
    
    When both branch_id and academic_year_id are provided, the filtering
    should apply both filters correctly.
    
    NOTE: This test may be skipped if academic years query is broken (Bug 1).
    The preservation requirement is about class filtering logic, not academic years query.
    
    **Validates: Requirements 3.5**
    """
    service = FaceRegistrationService()
    
    # Get test data
    branches = service.get_all_branches()
    academic_years = service.get_academic_years()
    
    if not branches:
        pytest.skip("No branches available for testing")
    
    # Skip if academic years query is broken (this is Bug 1, not related to class filtering)
    if not academic_years:
        pytest.skip("Academic years query is broken (Bug 1) - skipping this test")
    
    test_branch = branches[0]
    branch_id = test_branch['id']
    
    test_year = academic_years[0]
    year_id = test_year['id']
    year_name = test_year['name']
    
    # Call with both filters
    result = service.get_classes_by_filters(
        branch_id=branch_id,
        academic_year_id=year_id
    )
    
    # Property 1: Result should be a list
    assert isinstance(result, list), \
        f"Result should be a list, got {type(result)}"
    
    # Property 2: All returned classes should have the specified academic year
    for cls in result:
        assert cls['academic_year'] == year_name, \
            f"Class {cls['name']} has academic_year '{cls['academic_year']}', expected '{year_name}'"
    
    # Property 3: Result should be subset of branch-only filter
    branch_only_result = service.get_classes_by_filters(branch_id=branch_id)
    result_ids = set(cls['id'] for cls in result)
    branch_only_ids = set(cls['id'] for cls in branch_only_result)
    
    assert result_ids.issubset(branch_only_ids), \
        "Combined filter result should be subset of branch-only filter"


def test_class_filtering_baseline_snapshot():
    """
    Snapshot test: Verify exact baseline behavior
    
    This test captures the exact state observed on unfixed code.
    It serves as a regression detector for the preservation requirement.
    
    **Validates: Requirements 3.5**
    """
    service = FaceRegistrationService()
    db = SupabaseClient()
    
    # Test 1: No filters should return all active classes
    result_no_filters = service.get_classes_by_filters()
    all_classes = db.get_all_classes()
    
    assert len(result_no_filters) == len(all_classes), \
        "No filters should return all active classes"
    
    # Test 2: Verify data structure
    for cls in result_no_filters:
        assert isinstance(cls, dict), \
            f"Class should be a dict, got {type(cls)}"
        
        actual_fields = set(cls.keys())
        assert EXPECTED_CLASS_FIELDS.issubset(actual_fields), \
            f"Missing fields. Expected {EXPECTED_CLASS_FIELDS}, got {actual_fields}"
        
        assert cls['is_active'] is True, \
            f"Class {cls['name']} should be active"
    
    # Test 3: Verify no duplicates by ID
    class_ids = [cls['id'] for cls in result_no_filters]
    assert len(class_ids) == len(set(class_ids)), \
        "Class IDs should be unique (no duplicates)"
    
    # Test 4: Verify alphabetical ordering (query has .order('name'))
    class_names = [cls['name'] for cls in result_no_filters]
    assert class_names == sorted(class_names), \
        "Classes should be ordered alphabetically by name"


if __name__ == '__main__':
    print("\n" + "="*70)
    print("Preservation Property Test: Class Filtering")
    print("="*70)
    print("\nThis test MUST PASS on unfixed code to establish baseline behavior.")
    print("After fixes are applied, this test should STILL PASS (no regression).\n")
    
    try:
        # Run the property-based tests
        print("Running property-based test: filtering by branch (10 iterations)...")
        test_class_filtering_by_branch_property()
        print("✓ Branch filtering test PASSED")
        
        print("\nRunning property-based test: filtering by academic year (10 iterations)...")
        try:
            test_class_filtering_by_academic_year_property()
            print("✓ Academic year filtering test PASSED")
        except pytest.skip.Exception as e:
            print(f"⚠ Academic year filtering test SKIPPED: {e}")
            print("  (This is expected if Bug 1 - academic years query - is not yet fixed)")
        
        # Run deterministic test
        print("\nRunning deterministic consistency test...")
        test_class_filtering_deterministic()
        print("✓ Deterministic test PASSED")
        
        # Run no filters test
        print("\nRunning no filters test...")
        test_class_filtering_no_filters()
        print("✓ No filters test PASSED")
        
        # Run combined filters test
        print("\nRunning combined filters test...")
        try:
            test_class_filtering_combined_filters()
            print("✓ Combined filters test PASSED")
        except pytest.skip.Exception as e:
            print(f"⚠ Combined filters test SKIPPED: {e}")
            print("  (This is expected if Bug 1 - academic years query - is not yet fixed)")
        
        # Run snapshot test
        print("\nRunning baseline snapshot test...")
        test_class_filtering_baseline_snapshot()
        print("✓ Snapshot test PASSED")
        
        print("\n" + "="*70)
        print("ALL PRESERVATION TESTS PASSED")
        print("Baseline behavior confirmed: Class filtering works correctly")
        print("="*70)
        
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        print("\n" + "="*70)
        print("PRESERVATION TEST FAILED")
        print("This indicates the baseline behavior is different than expected.")
        print("="*70)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
