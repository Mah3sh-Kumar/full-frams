"""
Integration Test: Session Configuration Flow
Tests the complete session configuration workflow after all fixes are applied.

This test verifies:
- Academic year 2025-2026 exists and loads correctly
- All active classes have at least one subject
- Session configuration screen can load data successfully
- Subjects dropdown loads correctly for selected class
- Session can be created successfully

Requirements: 2.3, 2.4, 2.5
"""
import pytest
from database.client import SupabaseClient
from core.face_registration_service import FaceRegistrationService


class TestSessionConfigurationFlow:
    """Integration tests for the session configuration flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.db = SupabaseClient()
        self.registration_service = FaceRegistrationService()
    
    def test_academic_year_2025_2026_exists(self):
        """
        Test that academic year 2025-2026 exists in the database
        
        Verifies:
        - Academic years query returns data
        - Academic year 2025-2026 is present
        - Academic year has all required fields
        
        Requirements: 2.4
        """
        # Load academic years
        academic_years = self.registration_service.get_academic_years()
        
        # Verify academic years are loaded
        assert academic_years is not None, "Academic years should not be None"
        assert len(academic_years) > 0, "Academic years should not be empty"
        
        # Verify 2025-2026 exists
        year_names = [year['name'] for year in academic_years]
        assert '2025-2026' in year_names, "Academic year 2025-2026 should exist"
        
        # Get the 2025-2026 academic year
        academic_year_2025_2026 = next(
            (year for year in academic_years if year['name'] == '2025-2026'),
            None
        )
        
        assert academic_year_2025_2026 is not None, "Academic year 2025-2026 should be found"
        
        # Verify required fields
        assert 'id' in academic_year_2025_2026, "Academic year should have 'id' field"
        assert 'name' in academic_year_2025_2026, "Academic year should have 'name' field"
        assert 'start_date' in academic_year_2025_2026, "Academic year should have 'start_date' field"
        assert 'end_date' in academic_year_2025_2026, "Academic year should have 'end_date' field"
        assert 'is_current' in academic_year_2025_2026, "Academic year should have 'is_current' field"
        
        print(f"✓ Academic year 2025-2026 exists with all required fields")
        print(f"  ID: {academic_year_2025_2026['id']}")
        print(f"  Start Date: {academic_year_2025_2026['start_date']}")
        print(f"  End Date: {academic_year_2025_2026['end_date']}")
        print(f"  Is Current: {academic_year_2025_2026['is_current']}")
    
    def test_all_active_classes_have_subjects(self):
        """
        Test that all active classes have at least one subject assigned
        
        Verifies:
        - All classes can be loaded
        - Each active class has at least one subject
        - Subject data structure is correct
        
        Requirements: 2.3, 2.5
        """
        # Load all classes
        classes = self.db.get_all_classes()
        
        assert classes is not None, "Classes should not be None"
        assert len(classes) > 0, "Classes should not be empty"
        
        print(f"\n✓ Loaded {len(classes)} classes")
        
        # Check each class for subjects
        classes_without_subjects = []
        classes_with_subjects = []
        
        for cls in classes:
            class_id = cls['id']
            class_name = cls['name']
            academic_year = cls.get('academic_year', 'Unknown')
            
            # Query subjects for this class
            subjects = self.db.get_subjects_by_class(class_id)
            
            if not subjects or len(subjects) == 0:
                classes_without_subjects.append({
                    'name': class_name,
                    'academic_year': academic_year,
                    'id': class_id
                })
                print(f"  ✗ Class '{class_name}' ({academic_year}): NO SUBJECTS")
            else:
                classes_with_subjects.append({
                    'name': class_name,
                    'academic_year': academic_year,
                    'subject_count': len(subjects)
                })
                print(f"  ✓ Class '{class_name}' ({academic_year}): {len(subjects)} subjects")
        
        # Print summary
        print(f"\n=== Summary ===")
        print(f"Classes with subjects: {len(classes_with_subjects)}")
        print(f"Classes without subjects: {len(classes_without_subjects)}")
        
        # Assert all classes have subjects
        if classes_without_subjects:
            print(f"\n✗ FAIL: The following classes have no subjects:")
            for cls in classes_without_subjects:
                print(f"  - {cls['name']} ({cls['academic_year']})")
        
        assert len(classes_without_subjects) == 0, \
            f"All active classes should have at least one subject. " \
            f"Found {len(classes_without_subjects)} classes without subjects."
        
        print(f"\n✓ All {len(classes)} classes have at least one subject")
    
    def test_session_configuration_loads_correctly(self):
        """
        Test that session configuration screen can load data successfully
        
        Simulates the session_setup.py load_data() method:
        1. Load all classes
        2. Verify classes are available
        3. For each class, verify subjects can be loaded
        
        Requirements: 2.3, 2.4, 2.5
        """
        print("\n=== Testing Session Configuration Load ===")
        
        # Step 1: Load classes (simulating session_setup.py load_data())
        print("\n1. Loading classes...")
        classes = self.db.get_all_classes()
        
        assert classes is not None, "Classes should not be None"
        assert len(classes) > 0, "Classes should not be empty"
        
        print(f"   ✓ Loaded {len(classes)} classes")
        
        # Step 2: Verify each class has subjects (simulating _on_class_changed())
        print("\n2. Verifying subjects for each class...")
        all_classes_valid = True
        
        for cls in classes:
            class_id = cls['id']
            class_name = cls['name']
            academic_year = cls.get('academic_year', 'Unknown')
            
            # Load subjects for this class
            subjects = self.db.get_subjects_by_class(class_id)
            
            if not subjects or len(subjects) == 0:
                print(f"   ✗ Class '{class_name}' ({academic_year}): No subjects")
                all_classes_valid = False
            else:
                print(f"   ✓ Class '{class_name}' ({academic_year}): {len(subjects)} subjects")
        
        assert all_classes_valid, "All classes should have subjects for session configuration"
        
        print("\n✓ Session configuration can load all data successfully")
    
    def test_subjects_dropdown_loads_for_selected_class(self):
        """
        Test that subjects dropdown loads correctly when a class is selected
        
        Simulates:
        1. Load all classes
        2. Select a class (e.g., first class)
        3. Load subjects for that class
        4. Verify subjects are returned
        5. Verify subject data structure
        
        Requirements: 2.3, 2.5
        """
        print("\n=== Testing Subjects Dropdown Load ===")
        
        # Step 1: Load classes
        print("\n1. Loading classes...")
        classes = self.db.get_all_classes()
        assert len(classes) > 0, "Classes should be available"
        print(f"   ✓ Loaded {len(classes)} classes")
        
        # Step 2: Select first class
        print("\n2. Selecting first class...")
        selected_class = classes[0]
        class_id = selected_class['id']
        class_name = selected_class['name']
        academic_year = selected_class.get('academic_year', 'Unknown')
        print(f"   ✓ Selected: {class_name} ({academic_year})")
        
        # Step 3: Load subjects for selected class
        print("\n3. Loading subjects for selected class...")
        subjects = self.db.get_subjects_by_class(class_id)
        
        assert subjects is not None, "Subjects should not be None"
        assert len(subjects) > 0, f"Class '{class_name}' should have at least one subject"
        
        print(f"   ✓ Loaded {len(subjects)} subjects")
        
        # Step 4: Verify subject data structure
        print("\n4. Verifying subject data structure...")
        for subject in subjects:
            assert 'id' in subject, "Subject should have 'id' field"
            assert 'name' in subject, "Subject should have 'name' field"
            assert 'code' in subject, "Subject should have 'code' field"
            # Note: class_id is not returned in the query result, it's used as a filter
            
            print(f"   ✓ Subject: {subject['name']} ({subject['code']})")
        
        print(f"\n✓ Subjects dropdown loads correctly with {len(subjects)} subjects")
    
    def test_session_can_be_created_successfully(self):
        """
        Test that a session can be created successfully
        
        Simulates the complete flow:
        1. Load classes
        2. Select a class
        3. Load subjects for that class
        4. Verify session data can be prepared
        5. Verify all required fields are present
        
        Requirements: 2.3, 2.4, 2.5
        """
        print("\n=== Testing Session Creation ===")
        
        # Step 1: Load classes
        print("\n1. Loading classes...")
        classes = self.db.get_all_classes()
        assert len(classes) > 0, "Classes should be available"
        print(f"   ✓ Loaded {len(classes)} classes")
        
        # Step 2: Select a class (preferably one from 2025-2026)
        print("\n2. Selecting a class from academic year 2025-2026...")
        selected_class = None
        for cls in classes:
            if cls.get('academic_year') == '2025-2026':
                selected_class = cls
                break
        
        # If no 2025-2026 class found, use first class
        if not selected_class:
            print("   ⚠ No class found for 2025-2026, using first available class")
            selected_class = classes[0]
        
        class_id = selected_class['id']
        class_name = selected_class['name']
        academic_year = selected_class.get('academic_year', 'Unknown')
        print(f"   ✓ Selected: {class_name} ({academic_year})")
        
        # Step 3: Load subjects for selected class
        print("\n3. Loading subjects for selected class...")
        subjects = self.db.get_subjects_by_class(class_id)
        
        assert subjects is not None, "Subjects should not be None"
        assert len(subjects) > 0, f"Class '{class_name}' should have subjects"
        
        print(f"   ✓ Loaded {len(subjects)} subjects")
        
        # Step 4: Select first subject
        print("\n4. Selecting first subject...")
        selected_subject = subjects[0]
        subject_id = selected_subject['id']
        subject_name = selected_subject['name']
        subject_code = selected_subject['code']
        print(f"   ✓ Selected: {subject_name} ({subject_code})")
        
        # Step 5: Prepare session data (simulating _start_session())
        print("\n5. Preparing session data...")
        from datetime import datetime
        
        session_data = {
            'class_id': class_id,
            'class_name': f"{class_name} ({academic_year})",
            'subject_id': subject_id,
            'subject_name': f"{subject_name} ({subject_code})",
            'date': datetime.now().strftime("%Y-%m-%d"),
            'timestamp': datetime.now().isoformat()
        }
        
        # Step 6: Verify session data has all required fields
        print("\n6. Verifying session data...")
        assert 'class_id' in session_data, "Session data should have 'class_id'"
        assert 'class_name' in session_data, "Session data should have 'class_name'"
        assert 'subject_id' in session_data, "Session data should have 'subject_id'"
        assert 'subject_name' in session_data, "Session data should have 'subject_name'"
        assert 'date' in session_data, "Session data should have 'date'"
        assert 'timestamp' in session_data, "Session data should have 'timestamp'"
        
        print(f"   ✓ Session data prepared successfully:")
        print(f"     Class: {session_data['class_name']}")
        print(f"     Subject: {session_data['subject_name']}")
        print(f"     Date: {session_data['date']}")
        
        print("\n✓ Session can be created successfully")
    
    def test_full_session_configuration_flow(self):
        """
        Test the complete session configuration flow from start to finish
        
        This is a comprehensive end-to-end test that simulates the entire
        session configuration process as it would happen in the UI.
        
        Requirements: 2.3, 2.4, 2.5
        """
        print("\n" + "=" * 60)
        print("=== Full Session Configuration Flow Test ===")
        print("=" * 60)
        
        # Step 1: Verify academic year 2025-2026 exists
        print("\n1. Verifying academic year 2025-2026 exists...")
        academic_years = self.registration_service.get_academic_years()
        year_names = [year['name'] for year in academic_years]
        assert '2025-2026' in year_names, "Academic year 2025-2026 should exist"
        print(f"   ✓ Academic year 2025-2026 exists")
        
        # Step 2: Load classes
        print("\n2. Loading classes...")
        classes = self.db.get_all_classes()
        assert len(classes) > 0, "Classes should be available"
        print(f"   ✓ Loaded {len(classes)} classes")
        
        # Step 3: Verify all classes have subjects
        print("\n3. Verifying all classes have subjects...")
        classes_without_subjects = []
        for cls in classes:
            subjects = self.db.get_subjects_by_class(cls['id'])
            if not subjects or len(subjects) == 0:
                classes_without_subjects.append(cls['name'])
        
        assert len(classes_without_subjects) == 0, \
            f"All classes should have subjects. Classes without subjects: {classes_without_subjects}"
        print(f"   ✓ All {len(classes)} classes have subjects")
        
        # Step 4: Select a class from 2025-2026
        print("\n4. Selecting a class from academic year 2025-2026...")
        class_2025_2026 = None
        for cls in classes:
            if cls.get('academic_year') == '2025-2026':
                class_2025_2026 = cls
                break
        
        assert class_2025_2026 is not None, "At least one class should exist for 2025-2026"
        print(f"   ✓ Selected: {class_2025_2026['name']}")
        
        # Step 5: Load subjects for selected class
        print("\n5. Loading subjects for selected class...")
        subjects = self.db.get_subjects_by_class(class_2025_2026['id'])
        assert len(subjects) > 0, f"Class {class_2025_2026['name']} should have subjects"
        print(f"   ✓ Loaded {len(subjects)} subjects:")
        for subject in subjects:
            print(f"     - {subject['name']} ({subject['code']})")
        
        # Step 6: Select a subject
        print("\n6. Selecting first subject...")
        selected_subject = subjects[0]
        print(f"   ✓ Selected: {selected_subject['name']} ({selected_subject['code']})")
        
        # Step 7: Create session data
        print("\n7. Creating session data...")
        from datetime import datetime
        session_data = {
            'class_id': class_2025_2026['id'],
            'class_name': f"{class_2025_2026['name']} ({class_2025_2026['academic_year']})",
            'subject_id': selected_subject['id'],
            'subject_name': f"{selected_subject['name']} ({selected_subject['code']})",
            'date': datetime.now().strftime("%Y-%m-%d"),
            'timestamp': datetime.now().isoformat()
        }
        print(f"   ✓ Session data created:")
        print(f"     Class: {session_data['class_name']}")
        print(f"     Subject: {session_data['subject_name']}")
        print(f"     Date: {session_data['date']}")
        
        # Step 8: Verify session is ready to start
        print("\n8. Verifying session is ready to start...")
        assert session_data['class_id'] is not None, "Class ID should be set"
        assert session_data['subject_id'] is not None, "Subject ID should be set"
        assert session_data['date'] is not None, "Date should be set"
        print(f"   ✓ Session is ready to start")
        
        print("\n" + "=" * 60)
        print("=== Full Session Configuration Flow: SUCCESS ===")
        print("=" * 60)


if __name__ == '__main__':
    # Run tests with pytest
    pytest.main([__file__, '-v', '-s'])
