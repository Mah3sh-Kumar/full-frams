"""
Bug Condition Exploration Test: Academic Year 2025-2026 Missing from Database

This test is designed to FAIL on unfixed database to confirm the bug exists.
The bug: Classes reference academic year "2025-2026" but no matching record exists in academic_years table.

**Validates: Requirements 1.4, 2.4**

Expected behavior: Academic year "2025-2026" should exist in academic_years table
Actual behavior (unfixed): No record exists for "2025-2026" (only "2024-2025" exists)
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.client import SupabaseClient


def test_academic_year_2025_2026_exists():
    """
    Bug Condition Exploration: Test that academic year 2025-2026 exists in database
    
    This test encodes the EXPECTED behavior (record exists).
    On unfixed database, this test SHOULD FAIL, confirming the data is missing.
    After the migration script populates the data, this test will pass.
    
    **Validates: Requirements 1.4, 2.4**
    """
    print("\n" + "="*70)
    print("Bug Condition Exploration Test: Academic Year 2025-2026 Exists")
    print("="*70)
    
    # Initialize database client
    db = SupabaseClient()
    
    # Step 1: Query for all academic years to establish baseline
    print("\n1. Querying all academic years in database...")
    try:
        all_years_response = db.client.table('academic_years').select(
            'id, name, start_date, end_date, is_current'
        ).execute()
        all_years = all_years_response.data
        all_year_names = [year['name'] for year in all_years]
        print(f"   Found {len(all_years)} academic year(s) in database:")
        for year in all_years:
            current_marker = " (current)" if year.get('is_current') else ""
            print(f"     - {year['name']}{current_marker}")
    except Exception as e:
        print(f"   ✗ Error querying academic years: {e}")
        raise
    
    # Step 2: Check if classes reference "2025-2026"
    print("\n2. Checking if classes reference academic year '2025-2026'...")
    try:
        classes_2025_2026 = db.client.table('classes').select(
            'id, name, academic_year'
        ).eq('academic_year', '2025-2026').execute()
        classes_count = len(classes_2025_2026.data)
        print(f"   Found {classes_count} class(es) referencing '2025-2026'")
        if classes_count > 0:
            print("   Sample classes:")
            for cls in classes_2025_2026.data[:3]:  # Show first 3
                print(f"     - {cls['name']} (ID: {cls['id']})")
    except Exception as e:
        print(f"   ✗ Error querying classes: {e}")
        # Continue anyway - the main test is about academic_years table
        classes_count = 0
    
    # Step 3: Query specifically for "2025-2026" academic year
    print("\n3. Querying for academic year '2025-2026'...")
    try:
        target_year_response = db.client.table('academic_years').select(
            'id, name, start_date, end_date, is_current'
        ).eq('name', '2025-2026').execute()
        target_year = target_year_response.data
        result_count = len(target_year)
        print(f"   Query returned {result_count} record(s)")
        
        if result_count > 0:
            print(f"   Record details:")
            for year in target_year:
                print(f"     ID: {year['id']}")
                print(f"     Name: {year['name']}")
                print(f"     Start Date: {year.get('start_date', 'N/A')}")
                print(f"     End Date: {year.get('end_date', 'N/A')}")
                print(f"     Is Current: {year.get('is_current', False)}")
    except Exception as e:
        print(f"   ✗ Error querying for '2025-2026': {e}")
        raise
    
    # Step 4: Document the counterexample
    print("\n4. Bug Condition Analysis:")
    print(f"   Academic years in database: {', '.join(all_year_names) if all_year_names else 'None'}")
    print(f"   Classes referencing '2025-2026': {classes_count}")
    print(f"   Academic year '2025-2026' record exists: {'Yes' if result_count > 0 else 'No'}")
    
    if result_count == 0 and classes_count > 0:
        print("\n   ✗ BUG CONFIRMED!")
        print(f"   Counterexample: Query for academic year '2025-2026' returns no results")
        print(f"   Data inconsistency: {classes_count} classes reference '2025-2026' but no matching record exists")
        print("   Root cause: Database was not properly seeded with required academic year data")
        print("\n   This is the EXPECTED FAILURE for bug exploration.")
        print("   After running the migration script, this test should pass.")
    elif result_count == 0 and classes_count == 0:
        print("\n   ⚠ No classes reference '2025-2026' and no record exists")
        print("   This may indicate a different data state than expected.")
    elif result_count > 0:
        print("\n   ✓ Academic year '2025-2026' exists in database")
        print("   Bug may already be fixed, or migration has already been run.")
    
    # Step 5: Assert the expected behavior (this will fail on unfixed database)
    print("\n5. Assertion Checks:")
    failures = []
    
    # Check 1: Record should exist
    try:
        assert result_count > 0, \
            "Query for academic year '2025-2026' returns no results"
        print(f"   ✓ PASS: Academic year '2025-2026' exists in database")
    except AssertionError as e:
        print(f"   ✗ FAIL: {e}")
        failures.append(str(e))
    
    # Check 2: Record should have required fields
    if result_count > 0:
        try:
            year_record = target_year[0]
            assert 'id' in year_record, "Record missing 'id' field"
            assert 'name' in year_record, "Record missing 'name' field"
            assert year_record['name'] == '2025-2026', f"Record name is '{year_record['name']}', expected '2025-2026'"
            print(f"   ✓ PASS: Record has required fields and correct name")
        except AssertionError as e:
            print(f"   ✗ FAIL: {e}")
            failures.append(str(e))
    
    # Check 3: If classes reference it, record must exist (data integrity)
    if classes_count > 0:
        try:
            assert result_count > 0, \
                f"{classes_count} classes reference '2025-2026' but no matching academic_year record exists"
            print(f"   ✓ PASS: Data integrity maintained (classes have matching academic year)")
        except AssertionError as e:
            print(f"   ✗ FAIL: {e}")
            failures.append(str(e))
    
    if failures:
        print("\n" + "="*70)
        print("TEST RESULT: FAILED (Bug Confirmed)")
        print("="*70)
        print(f"\nCounterexample documented:")
        print(f"  Query for academic year '2025-2026' returns no results")
        if classes_count > 0:
            print(f"  Data inconsistency: {classes_count} classes reference '2025-2026' without matching record")
        raise AssertionError(f"{len(failures)} assertion(s) failed: " + "; ".join(failures))
    
    print("\n" + "="*70)
    print("TEST RESULT: PASSED (Bug Fixed or Not Present)")
    print("="*70)


if __name__ == '__main__':
    try:
        test_academic_year_2025_2026_exists()
    except AssertionError:
        # Expected failure on unfixed database
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
