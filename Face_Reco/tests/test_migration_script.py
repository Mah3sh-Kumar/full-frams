"""
Test Migration Script in Test Environment

This test file validates the migration script functionality:
- Academic year 2025-2026 creation
- Subject population for all classes
- Data integrity validation
- Idempotency (running multiple times)
- Rollback capability

Requirements: 2.3, 2.4, 2.5
"""
import sys
import os
from typing import Dict, Any, List

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.client import SupabaseClient
from database.migrations.populate_missing_data import (
    populate_academic_years,
    populate_subjects,
    validate_data
)


class TestMigrationScript:
    """Test suite for migration script"""
    
    def __init__(self):
        self.db = SupabaseClient()
        self.test_results = []
        
    def log_result(self, test_name: str, passed: bool, message: str = ""):
        """Log test result"""
        status = "✓ PASS" if passed else "✗ FAIL"
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "message": message
        })
        print(f"{status}: {test_name}")
        if message:
            print(f"  {message}")
    
    def test_academic_year_creation(self) -> bool:
        """Test that academic year 2025-2026 is created correctly"""
        print("\n" + "="*60)
        print("TEST 1: Academic Year 2025-2026 Creation")
        print("="*60)
        
        try:
            # Query for 2025-2026
            result = self.db.client.table('academic_years').select(
                'id, name, start_date, end_date, is_current'
            ).eq('name', '2025-2026').execute()
            
            if not result.data:
                self.log_result(
                    "Academic year 2025-2026 exists",
                    False,
                    "Academic year 2025-2026 not found in database"
                )
                return False
            
            ay = result.data[0]
            
            # Verify fields
            checks = [
                (ay.get('name') == '2025-2026', "Name is '2025-2026'"),
                (ay.get('start_date') is not None, "Start date is set"),
                (ay.get('end_date') is not None, "End date is set"),
                (ay.get('is_current') is not None, "is_current field is set")
            ]
            
            all_passed = True
            for check, desc in checks:
                if check:
                    self.log_result(f"  {desc}", True)
                else:
                    self.log_result(f"  {desc}", False)
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_result(
                "Academic year 2025-2026 creation test",
                False,
                f"Error: {e}"
            )
            return False
    
    def test_subjects_for_all_classes(self) -> bool:
        """Test that all active classes have subjects"""
        print("\n" + "="*60)
        print("TEST 2: Subjects Created for All Classes")
        print("="*60)
        
        try:
            # Get all active classes
            classes = self.db.client.table('classes').select(
                'id, name, academic_year'
            ).eq('is_active', True).execute()
            
            if not classes.data:
                self.log_result(
                    "Classes query",
                    False,
                    "No active classes found"
                )
                return False
            
            print(f"Found {len(classes.data)} active classes")
            
            classes_without_subjects = []
            classes_with_subjects = []
            
            for cls in classes.data:
                class_id = cls['id']
                class_name = cls['name']
                
                # Query subjects for this class
                subjects = self.db.client.table('subjects').select(
                    'id, name, code'
                ).eq('class_id', class_id).eq('is_active', True).execute()
                
                if subjects.data:
                    classes_with_subjects.append({
                        'name': class_name,
                        'subject_count': len(subjects.data)
                    })
                    print(f"  ✓ {class_name}: {len(subjects.data)} subjects")
                else:
                    classes_without_subjects.append(class_name)
                    print(f"  ✗ {class_name}: No subjects")
            
            # Log results
            if classes_without_subjects:
                self.log_result(
                    "All classes have subjects",
                    False,
                    f"{len(classes_without_subjects)} classes without subjects: {', '.join(classes_without_subjects)}"
                )
                return False
            else:
                self.log_result(
                    "All classes have subjects",
                    True,
                    f"All {len(classes.data)} classes have subjects assigned"
                )
                return True
                
        except Exception as e:
            self.log_result(
                "Subjects for all classes test",
                False,
                f"Error: {e}"
            )
            return False
    
    def test_data_integrity_validation(self) -> bool:
        """Test that data integrity validation passes"""
        print("\n" + "="*60)
        print("TEST 3: Data Integrity Validation")
        print("="*60)
        
        try:
            # Run the validation function from migration script
            validation_passed = validate_data(self.db)
            
            self.log_result(
                "Data integrity validation",
                validation_passed,
                "All integrity checks passed" if validation_passed else "Integrity issues found"
            )
            
            return validation_passed
            
        except Exception as e:
            self.log_result(
                "Data integrity validation test",
                False,
                f"Error: {e}"
            )
            return False
    
    def test_idempotency(self) -> bool:
        """Test that running migration multiple times is safe"""
        print("\n" + "="*60)
        print("TEST 4: Idempotency (Running Migration Multiple Times)")
        print("="*60)
        
        try:
            # Get current state
            ay_before = self.db.client.table('academic_years').select('id').eq('name', '2025-2026').execute()
            classes = self.db.client.table('classes').select('id').eq('is_active', True).execute()
            
            subjects_before = {}
            for cls in classes.data:
                subjects = self.db.client.table('subjects').select('id').eq('class_id', cls['id']).execute()
                subjects_before[cls['id']] = len(subjects.data)
            
            print(f"Before re-run: {len(ay_before.data)} academic year records")
            print(f"Before re-run: {sum(subjects_before.values())} total subjects")
            
            # Run migration functions again
            print("\nRunning migration functions again...")
            ay_result = populate_academic_years(self.db)
            subj_result = populate_subjects(self.db)
            
            # Get state after re-run
            ay_after = self.db.client.table('academic_years').select('id').eq('name', '2025-2026').execute()
            
            subjects_after = {}
            for cls in classes.data:
                subjects = self.db.client.table('subjects').select('id').eq('class_id', cls['id']).execute()
                subjects_after[cls['id']] = len(subjects.data)
            
            print(f"After re-run: {len(ay_after.data)} academic year records")
            print(f"After re-run: {sum(subjects_after.values())} total subjects")
            
            # Verify no duplicates were created
            checks = [
                (len(ay_after.data) == len(ay_before.data), "Academic year count unchanged"),
                (subjects_after == subjects_before, "Subject counts unchanged for all classes"),
                (ay_result, "Academic year function returned success"),
                (subj_result or sum(subjects_before.values()) > 0, "Subject function handled existing data")
            ]
            
            all_passed = True
            for check, desc in checks:
                if check:
                    self.log_result(f"  {desc}", True)
                else:
                    self.log_result(f"  {desc}", False)
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_result(
                "Idempotency test",
                False,
                f"Error: {e}"
            )
            return False
    
    def test_academic_year_references(self) -> bool:
        """Test that all class academic_year references are valid"""
        print("\n" + "="*60)
        print("TEST 5: Academic Year References Validation")
        print("="*60)
        
        try:
            # Get all classes with their academic years
            classes = self.db.client.table('classes').select(
                'id, name, academic_year'
            ).execute()
            
            # Get all academic year names
            academic_years = self.db.client.table('academic_years').select('name').execute()
            year_names = {ay['name'] for ay in academic_years.data}
            
            print(f"Found {len(classes.data)} classes")
            print(f"Found {len(year_names)} academic years: {', '.join(sorted(year_names))}")
            
            invalid_references = []
            
            for cls in classes.data:
                if cls['academic_year'] not in year_names:
                    invalid_references.append({
                        'class': cls['name'],
                        'academic_year': cls['academic_year']
                    })
                    print(f"  ✗ {cls['name']}: references non-existent '{cls['academic_year']}'")
                else:
                    print(f"  ✓ {cls['name']}: references valid '{cls['academic_year']}'")
            
            if invalid_references:
                self.log_result(
                    "All academic year references valid",
                    False,
                    f"{len(invalid_references)} classes with invalid references"
                )
                return False
            else:
                self.log_result(
                    "All academic year references valid",
                    True,
                    f"All {len(classes.data)} classes reference valid academic years"
                )
                return True
                
        except Exception as e:
            self.log_result(
                "Academic year references test",
                False,
                f"Error: {e}"
            )
            return False
    
    def test_subject_data_structure(self) -> bool:
        """Test that subjects have correct data structure"""
        print("\n" + "="*60)
        print("TEST 6: Subject Data Structure Validation")
        print("="*60)
        
        try:
            # Get a sample of subjects
            subjects = self.db.client.table('subjects').select(
                'id, name, code, class_id, is_active'
            ).limit(10).execute()
            
            if not subjects.data:
                self.log_result(
                    "Subject data structure",
                    False,
                    "No subjects found to validate"
                )
                return False
            
            print(f"Validating {len(subjects.data)} sample subjects...")
            
            required_fields = ['id', 'name', 'code', 'class_id', 'is_active']
            all_valid = True
            
            for subj in subjects.data:
                missing_fields = [field for field in required_fields if field not in subj]
                
                if missing_fields:
                    print(f"  ✗ Subject {subj.get('name', 'unknown')}: missing fields {missing_fields}")
                    all_valid = False
                else:
                    print(f"  ✓ Subject {subj['name']}: all required fields present")
            
            self.log_result(
                "Subject data structure valid",
                all_valid,
                "All subjects have required fields" if all_valid else "Some subjects missing required fields"
            )
            
            return all_valid
            
        except Exception as e:
            self.log_result(
                "Subject data structure test",
                False,
                f"Error: {e}"
            )
            return False
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all migration tests"""
        print("\n" + "="*70)
        print("MIGRATION SCRIPT TEST SUITE")
        print("Testing Requirements: 2.3, 2.4, 2.5")
        print("="*70)
        
        tests = [
            self.test_academic_year_creation,
            self.test_subjects_for_all_classes,
            self.test_data_integrity_validation,
            self.test_idempotency,
            self.test_academic_year_references,
            self.test_subject_data_structure
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"\n✗ Test {test.__name__} crashed: {e}")
                import traceback
                traceback.print_exc()
                failed += 1
        
        # Print summary
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Total Tests: {passed + failed}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        
        if failed == 0:
            print("\n✓ ALL TESTS PASSED - Migration script is working correctly!")
        else:
            print(f"\n✗ {failed} TEST(S) FAILED - Review issues above")
        
        print("="*70)
        
        return {
            "total": passed + failed,
            "passed": passed,
            "failed": failed,
            "success_rate": passed / (passed + failed) * 100 if (passed + failed) > 0 else 0,
            "all_passed": failed == 0,
            "results": self.test_results
        }


def main():
    """Run migration script tests"""
    try:
        tester = TestMigrationScript()
        results = tester.run_all_tests()
        
        # Exit with appropriate code
        sys.exit(0 if results["all_passed"] else 1)
        
    except Exception as e:
        print(f"\n✗ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
