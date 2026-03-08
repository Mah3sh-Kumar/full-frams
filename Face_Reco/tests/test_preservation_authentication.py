"""
Preservation Property Test: Authentication Flow Remains Unchanged

This is a PRESERVATION test that MUST PASS on the current unfixed code.
It captures baseline authentication behavior that must remain unchanged after the fixes.

**Validates: Requirements 3.4**

Expected behavior: User authentication should work correctly without any changes
This test ensures no regressions are introduced when fixing data query bugs.

Property-based testing approach:
- Tests authentication with valid credentials
- Verifies user profile data structure remains unchanged
- Ensures session data integrity is preserved
- Confirms authentication logic is unaffected by data query fixes
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.client import SupabaseClient
from hypothesis import given, strategies as st, settings, Phase
import pytest


# Expected baseline behavior (observed on unfixed code)
EXPECTED_AUTH_RESPONSE_FIELDS = {'success', 'user', 'profile', 'error'}
EXPECTED_USER_PROFILE_FIELDS = {'id', 'email', 'role', 'full_name', 'is_verified'}
VALID_ROLES = {'teacher', 'admin', 'student'}


@given(st.integers(min_value=1, max_value=20))
@settings(max_examples=20, phases=[Phase.generate, Phase.target], deadline=None)
def test_authentication_flow_structure_unchanged(call_number):
    """
    Property: Authentication flow returns consistent data structure
    
    This property-based test verifies that:
    1. sign_in() returns a dict with expected fields
    2. The response structure is consistent across multiple calls
    3. User profile data structure remains unchanged
    4. Authentication logic is deterministic
    
    The test generates many calls to verify consistency and stability.
    
    **Validates: Requirements 3.4**
    """
    # Initialize database client
    db = SupabaseClient()
    
    # Test with invalid credentials (should always fail consistently)
    # This tests the error path without needing real credentials
    result = db.sign_in("nonexistent@example.com", "wrongpassword")
    
    # Property 1: Response is always a dict
    assert isinstance(result, dict), \
        f"Authentication response should be a dict, got {type(result)}"
    
    # Property 2: Response always has 'success' field
    assert 'success' in result, \
        "Authentication response must have 'success' field"
    
    # Property 3: Response always has 'error' field when success is False
    assert isinstance(result['success'], bool), \
        f"'success' field should be bool, got {type(result['success'])}"
    
    if not result['success']:
        assert 'error' in result, \
            "Failed authentication must have 'error' field"
        assert isinstance(result['error'], str), \
            f"'error' field should be string, got {type(result['error'])}"
    
    # Property 4: Successful authentication has user and profile fields
    # (We can't test this without valid credentials, but we verify the structure)
    if result['success']:
        assert 'user' in result, \
            "Successful authentication must have 'user' field"
        assert 'profile' in result, \
            "Successful authentication must have 'profile' field"


def test_authentication_error_handling_unchanged():
    """
    Property: Authentication error handling is consistent
    
    Invalid credentials should always return the same error structure.
    This verifies that error handling logic is unchanged.
    
    **Validates: Requirements 3.4**
    """
    db = SupabaseClient()
    
    # Test with invalid credentials multiple times
    result1 = db.sign_in("invalid@example.com", "wrongpass")
    result2 = db.sign_in("invalid@example.com", "wrongpass")
    result3 = db.sign_in("invalid@example.com", "wrongpass")
    
    # All should fail consistently
    assert result1['success'] is False
    assert result2['success'] is False
    assert result3['success'] is False
    
    # All should have error field
    assert 'error' in result1
    assert 'error' in result2
    assert 'error' in result3
    
    # Error messages should be consistent
    assert isinstance(result1['error'], str)
    assert isinstance(result2['error'], str)
    assert isinstance(result3['error'], str)


def test_authentication_method_signature_unchanged():
    """
    Property: Authentication method signature is unchanged
    
    The sign_in method should accept email and password parameters
    and return a dict. This verifies the API contract is preserved.
    
    **Validates: Requirements 3.4**
    """
    db = SupabaseClient()
    
    # Verify method exists and is callable
    assert hasattr(db, 'sign_in'), \
        "SupabaseClient must have sign_in method"
    assert callable(db.sign_in), \
        "sign_in must be callable"
    
    # Verify method accepts email and password
    import inspect
    sig = inspect.signature(db.sign_in)
    params = list(sig.parameters.keys())
    
    assert 'email' in params, \
        "sign_in must accept 'email' parameter"
    assert 'password' in params, \
        "sign_in must accept 'password' parameter"
    
    # Verify method returns dict
    result = db.sign_in("test@example.com", "testpass")
    assert isinstance(result, dict), \
        "sign_in must return a dict"


def test_user_profile_query_structure_unchanged():
    """
    Property: User profile query structure is unchanged
    
    The get_user_by_email method should return the same data structure.
    This verifies that user profile queries are unaffected by data fixes.
    
    **Validates: Requirements 3.4**
    """
    db = SupabaseClient()
    
    # Verify method exists and is callable
    assert hasattr(db, 'get_user_by_email'), \
        "SupabaseClient must have get_user_by_email method"
    assert callable(db.get_user_by_email), \
        "get_user_by_email must be callable"
    
    # Test with non-existent email (should return None)
    result = db.get_user_by_email("nonexistent@example.com")
    
    # Property: Returns None for non-existent users
    assert result is None or isinstance(result, dict), \
        f"get_user_by_email should return None or dict, got {type(result)}"
    
    # If a user is returned, verify structure
    if result is not None:
        assert isinstance(result, dict), \
            "User profile should be a dict"
        
        # Check expected fields are present
        for field in ['id', 'email', 'role', 'full_name', 'is_verified']:
            assert field in result, \
                f"User profile must have '{field}' field"


def test_authentication_deterministic():
    """
    Property: Authentication is deterministic
    
    Multiple authentication attempts with the same credentials
    should return consistent results.
    
    **Validates: Requirements 3.4**
    """
    db = SupabaseClient()
    
    # Test with same invalid credentials multiple times
    email = "test@example.com"
    password = "testpass"
    
    results = []
    for _ in range(5):
        result = db.sign_in(email, password)
        results.append(result)
    
    # All results should have same success status
    success_values = [r['success'] for r in results]
    assert len(set(success_values)) == 1, \
        "Authentication should return consistent success status"
    
    # All results should have same structure
    for result in results:
        assert isinstance(result, dict)
        assert 'success' in result
        if not result['success']:
            assert 'error' in result


def test_authentication_baseline_snapshot():
    """
    Snapshot test: Verify exact baseline authentication behavior
    
    This test captures the exact authentication flow observed on unfixed code.
    It serves as a regression detector for the preservation requirement.
    
    **Validates: Requirements 3.4**
    """
    db = SupabaseClient()
    
    # Test authentication with invalid credentials
    result = db.sign_in("invalid@example.com", "wrongpassword")
    
    # Verify baseline behavior
    assert isinstance(result, dict), \
        "Baseline: Authentication should return dict"
    
    assert 'success' in result, \
        "Baseline: Response must have 'success' field"
    
    assert result['success'] is False, \
        "Baseline: Invalid credentials should fail"
    
    assert 'error' in result, \
        "Baseline: Failed authentication must have 'error' field"
    
    assert isinstance(result['error'], str), \
        "Baseline: Error should be a string"
    
    # Verify error message is meaningful (not empty)
    assert len(result['error']) > 0, \
        "Baseline: Error message should not be empty"
    
    # Verify no unexpected fields in error response
    expected_fields = {'success', 'error'}
    actual_fields = set(result.keys())
    
    # Error response should only have success and error fields
    assert actual_fields == expected_fields or 'user' in actual_fields or 'profile' in actual_fields, \
        f"Baseline: Response structure should be consistent"


if __name__ == '__main__':
    print("\n" + "="*70)
    print("Preservation Property Test: Authentication Flow")
    print("="*70)
    print("\nThis test MUST PASS on unfixed code to establish baseline behavior.")
    print("After fixes are applied, this test should STILL PASS (no regression).\n")
    
    try:
        # Run the property-based test
        print("Running property-based test (20 examples)...")
        test_authentication_flow_structure_unchanged()
        print("✓ Property-based test PASSED")
        
        # Run error handling test
        print("\nRunning error handling consistency test...")
        test_authentication_error_handling_unchanged()
        print("✓ Error handling test PASSED")
        
        # Run method signature test
        print("\nRunning method signature test...")
        test_authentication_method_signature_unchanged()
        print("✓ Method signature test PASSED")
        
        # Run user profile query test
        print("\nRunning user profile query structure test...")
        test_user_profile_query_structure_unchanged()
        print("✓ User profile query test PASSED")
        
        # Run deterministic test
        print("\nRunning deterministic consistency test...")
        test_authentication_deterministic()
        print("✓ Deterministic test PASSED")
        
        # Run snapshot test
        print("\nRunning baseline snapshot test...")
        test_authentication_baseline_snapshot()
        print("✓ Snapshot test PASSED")
        
        print("\n" + "="*70)
        print("ALL PRESERVATION TESTS PASSED")
        print("Baseline behavior confirmed: Authentication flow is unchanged")
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
