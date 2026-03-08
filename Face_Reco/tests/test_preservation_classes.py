"""
Preservation Property Test: Class Loading Returns 17 Classes

This is a PRESERVATION test that MUST PASS on the current unfixed code.
It captures baseline behavior that must remain unchanged after the fixes.

**Validates: Requirements 3.2**

Expected behavior: get_all_classes() should always return exactly 17 classes
This test ensures no regressions are introduced when fixing other bugs.

Property-based testing approach:
- Generates many test cases to verify the property holds consistently
- Tests that class loading is deterministic and stable
- Verifies data structure integrity across multiple calls
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.client import SupabaseClient
from hypothesis import given, strategies as st, settings, Phase
import pytest


# Expected baseline behavior (observed on unfixed code)
EXPECTED_CLASS_COUNT = 17
EXPECTED_CLASS_FIELDS = {'id', 'name', 'academic_year', 'is_active'}


@given(st.integers(min_value=1, max_value=100))
@settings(max_examples=50, phases=[Phase.generate, Phase.target], deadline=None)
def test_class_loading_returns_17_classes(call_number):
    """
    Property: Class loading always returns exactly 17 classes
    
    This property-based test verifies that:
    1. get_all_classes() consistently returns 17 classes
    2. The data structure remains unchanged across multiple calls
    3. All required fields are present in each class record
    4. All classes have is_active=True (as per the query filter)
    
    The test generates many calls to verify consistency and stability.
    
    **Validates: Requirements 3.2**
    """
    # Initialize database client
    db = SupabaseClient()
    
    # Call the method
    result = db.get_all_classes()
    
    # Property 1: Always returns exactly 17 classes
    assert len(result) == EXPECTED_CLASS_COUNT, \
        f"Expected {EXPECTED_CLASS_COUNT} classes, got {len(result)}"
    
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
        
        # Property 3: All classes are active (as per query filter)
        assert cls['is_active'] is True, \
            f"Class {cls['name']} should be active"
        
        # Property 4: No empty values for required fields
        assert cls['id'].strip() != '', \
            f"Class id should not be empty"
        assert cls['name'].strip() != '', \
            f"Class name should not be empty"
        assert cls['academic_year'].strip() != '', \
            f"Class academic_year should not be empty"


def test_class_loading_deterministic():
    """
    Property: Class loading is deterministic
    
    Multiple calls to get_all_classes() should return the same results
    in the same order (since the query has .order('name')).
    
    **Validates: Requirements 3.2**
    """
    db = SupabaseClient()
    
    # Call multiple times
    result1 = db.get_all_classes()
    result2 = db.get_all_classes()
    result3 = db.get_all_classes()
    
    # Should return same count
    assert len(result1) == len(result2) == len(result3) == EXPECTED_CLASS_COUNT
    
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


def test_class_loading_baseline_snapshot():
    """
    Snapshot test: Verify exact baseline behavior
    
    This test captures the exact state observed on unfixed code.
    It serves as a regression detector for the preservation requirement.
    
    **Validates: Requirements 3.2**
    """
    db = SupabaseClient()
    result = db.get_all_classes()
    
    # Verify count
    assert len(result) == 17, \
        f"Baseline: Expected 17 classes, got {len(result)}"
    
    # Verify all classes are present (by checking names exist)
    class_names = {cls['name'] for cls in result}
    
    # At least these classes should exist
    # (We don't hardcode exact names to avoid brittleness, but verify count and structure)
    assert len(class_names) == 17, \
        f"Expected 17 unique class names, got {len(class_names)}"
    
    # Verify no duplicates by ID
    class_ids = [cls['id'] for cls in result]
    assert len(class_ids) == len(set(class_ids)), \
        "Class IDs should be unique (no duplicates)"
    
    # Verify alphabetical ordering (query has .order('name'))
    class_names_list = [cls['name'] for cls in result]
    assert class_names_list == sorted(class_names_list), \
        "Classes should be ordered alphabetically by name"
    
    # Verify academic year field exists and is not empty for all classes
    for cls in result:
        assert 'academic_year' in cls, \
            f"Class {cls['name']} missing academic_year field"
        assert cls['academic_year'].strip() != '', \
            f"Class {cls['name']} has empty academic_year"


if __name__ == '__main__':
    print("\n" + "="*70)
    print("Preservation Property Test: Class Loading")
    print("="*70)
    print("\nThis test MUST PASS on unfixed code to establish baseline behavior.")
    print("After fixes are applied, this test should STILL PASS (no regression).\n")
    
    try:
        # Run the property-based test
        print("Running property-based test (50 examples)...")
        test_class_loading_returns_17_classes()
        print("✓ Property-based test PASSED")
        
        # Run deterministic test
        print("\nRunning deterministic consistency test...")
        test_class_loading_deterministic()
        print("✓ Deterministic test PASSED")
        
        # Run snapshot test
        print("\nRunning baseline snapshot test...")
        test_class_loading_baseline_snapshot()
        print("✓ Snapshot test PASSED")
        
        print("\n" + "="*70)
        print("ALL PRESERVATION TESTS PASSED")
        print("Baseline behavior confirmed: get_all_classes() returns 17 classes")
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
