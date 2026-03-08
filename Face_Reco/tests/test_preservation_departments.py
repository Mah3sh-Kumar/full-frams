"""
Preservation Property Test: Department Loading Returns 5 Departments

This is a PRESERVATION test that MUST PASS on the current unfixed code.
It captures baseline behavior that must remain unchanged after the fixes.

**Validates: Requirements 3.1**

Expected behavior: get_departments() should always return exactly 5 departments
This test ensures no regressions are introduced when fixing other bugs.

Property-based testing approach:
- Generates many test cases to verify the property holds consistently
- Tests that department loading is deterministic and stable
- Verifies data structure integrity across multiple calls
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.face_registration_service import FaceRegistrationService
from hypothesis import given, strategies as st, settings, Phase
import pytest


# Expected baseline behavior (observed on unfixed code)
EXPECTED_DEPARTMENT_COUNT = 5
EXPECTED_DEPARTMENT_FIELDS = {'id', 'name', 'code', 'is_active'}


@given(st.integers(min_value=1, max_value=100))
@settings(max_examples=50, phases=[Phase.generate, Phase.target], deadline=None)
def test_department_loading_returns_5_departments(call_number):
    """
    Property: Department loading always returns exactly 5 departments
    
    This property-based test verifies that:
    1. get_departments() consistently returns 5 departments
    2. The data structure remains unchanged across multiple calls
    3. All required fields are present in each department record
    4. All departments have is_active=True (as per the query filter)
    
    The test generates many calls to verify consistency and stability.
    
    **Validates: Requirements 3.1**
    """
    # Initialize service
    service = FaceRegistrationService()
    
    # Call the method
    result = service.get_departments()
    
    # Property 1: Always returns exactly 5 departments
    assert len(result) == EXPECTED_DEPARTMENT_COUNT, \
        f"Expected {EXPECTED_DEPARTMENT_COUNT} departments, got {len(result)}"
    
    # Property 2: Each department has the correct data structure
    for dept in result:
        assert isinstance(dept, dict), \
            f"Department should be a dict, got {type(dept)}"
        
        # Check all required fields are present
        actual_fields = set(dept.keys())
        assert EXPECTED_DEPARTMENT_FIELDS.issubset(actual_fields), \
            f"Missing fields. Expected {EXPECTED_DEPARTMENT_FIELDS}, got {actual_fields}"
        
        # Check field types
        assert isinstance(dept['id'], str), \
            f"Department id should be string, got {type(dept['id'])}"
        assert isinstance(dept['name'], str), \
            f"Department name should be string, got {type(dept['name'])}"
        assert isinstance(dept['code'], str), \
            f"Department code should be string, got {type(dept['code'])}"
        assert isinstance(dept['is_active'], bool), \
            f"Department is_active should be bool, got {type(dept['is_active'])}"
        
        # Property 3: All departments are active (as per query filter)
        assert dept['is_active'] is True, \
            f"Department {dept['name']} should be active"
        
        # Property 4: No empty values for required fields
        assert dept['id'].strip() != '', \
            f"Department id should not be empty"
        assert dept['name'].strip() != '', \
            f"Department name should not be empty"
        assert dept['code'].strip() != '', \
            f"Department code should not be empty"


def test_department_loading_deterministic():
    """
    Property: Department loading is deterministic
    
    Multiple calls to get_departments() should return the same results
    in the same order (since the query has .order('name')).
    
    **Validates: Requirements 3.1**
    """
    service = FaceRegistrationService()
    
    # Call multiple times
    result1 = service.get_departments()
    result2 = service.get_departments()
    result3 = service.get_departments()
    
    # Should return same count
    assert len(result1) == len(result2) == len(result3) == EXPECTED_DEPARTMENT_COUNT
    
    # Should return same department IDs in same order
    ids1 = [dept['id'] for dept in result1]
    ids2 = [dept['id'] for dept in result2]
    ids3 = [dept['id'] for dept in result3]
    
    assert ids1 == ids2 == ids3, \
        "Department IDs should be consistent across calls"
    
    # Should return same department names in same order
    names1 = [dept['name'] for dept in result1]
    names2 = [dept['name'] for dept in result2]
    names3 = [dept['name'] for dept in result3]
    
    assert names1 == names2 == names3, \
        "Department names should be consistent across calls"


def test_department_loading_baseline_snapshot():
    """
    Snapshot test: Verify exact baseline behavior
    
    This test captures the exact state observed on unfixed code.
    It serves as a regression detector for the preservation requirement.
    
    **Validates: Requirements 3.1**
    """
    service = FaceRegistrationService()
    result = service.get_departments()
    
    # Verify count
    assert len(result) == 5, \
        f"Baseline: Expected 5 departments, got {len(result)}"
    
    # Verify all departments are present (by checking names exist)
    # We observed: Arts, Commerce, Compute Science, Law, Science
    dept_names = {dept['name'] for dept in result}
    
    # At least these departments should exist
    # (We don't hardcode exact names to avoid brittleness, but verify count and structure)
    assert len(dept_names) == 5, \
        f"Expected 5 unique department names, got {len(dept_names)}"
    
    # Verify no duplicates by ID
    dept_ids = [dept['id'] for dept in result]
    assert len(dept_ids) == len(set(dept_ids)), \
        "Department IDs should be unique (no duplicates)"
    
    # Verify alphabetical ordering (query has .order('name'))
    dept_names_list = [dept['name'] for dept in result]
    assert dept_names_list == sorted(dept_names_list), \
        "Departments should be ordered alphabetically by name"


if __name__ == '__main__':
    print("\n" + "="*70)
    print("Preservation Property Test: Department Loading")
    print("="*70)
    print("\nThis test MUST PASS on unfixed code to establish baseline behavior.")
    print("After fixes are applied, this test should STILL PASS (no regression).\n")
    
    try:
        # Run the property-based test
        print("Running property-based test (50 examples)...")
        test_department_loading_returns_5_departments()
        print("✓ Property-based test PASSED")
        
        # Run deterministic test
        print("\nRunning deterministic consistency test...")
        test_department_loading_deterministic()
        print("✓ Deterministic test PASSED")
        
        # Run snapshot test
        print("\nRunning baseline snapshot test...")
        test_department_loading_baseline_snapshot()
        print("✓ Snapshot test PASSED")
        
        print("\n" + "="*70)
        print("ALL PRESERVATION TESTS PASSED")
        print("Baseline behavior confirmed: get_departments() returns 5 departments")
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
