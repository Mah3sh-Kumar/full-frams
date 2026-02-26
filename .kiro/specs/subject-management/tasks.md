# Implementation Plan: Subject Management

## Overview

This implementation plan breaks down the Subject Management feature into discrete coding tasks. The feature adds a fourth tab to the existing OrganizationManager screen, enabling administrators to manage academic subjects with many-to-many teacher relationships. The implementation follows the established FRAMS architecture pattern with clear separation between presentation, business logic, and data access layers.

## Tasks

- [ ] 1. Set up database schema and data access layer
  - [ ] 1.1 Create database migration for subjects and subject_teachers tables
    - Create migration file `supabase/migrations/YYYYMMDD_create_subjects_tables.sql`
    - Define subjects table with columns: id, name, code, class_id, is_active, created_at, updated_at
    - Define subject_teachers junction table with columns: id, subject_id, teacher_id, created_at
    - Add foreign key constraints (class_id → classes.id RESTRICT, subject_id → subjects.id CASCADE, teacher_id → users.id CASCADE)
    - Add unique constraint on subject_teachers(subject_id, teacher_id)
    - Create indexes on class_id, code, is_active, subject_id, teacher_id
    - Add RLS policies for authenticated read and admin full access
    - Add updated_at trigger for subjects table
    - _Requirements: 1.6, 11.1_

  - [ ] 1.2 Create SubjectItem and related TypeScript interfaces
    - Add SubjectItem interface to lib/types.ts with all required fields
    - Add TeacherInfo interface for joined teacher data
    - Add SubjectTeacherItem interface for junction table
    - _Requirements: 11.2_

  - [ ] 1.3 Implement subjects.ts data access module
    - Create lib/subjects.ts file
    - Implement getSubjects(includeInactive?) function with joins to classes and subject_teachers
    - Implement getSubjectsByTeacher(teacherId) function
    - Implement getSubjectsByClass(classId) function for student access
    - Implement createSubject(name, code, classId, teacherIds[]) with transaction handling
    - Implement updateSubject(id, updates, teacherIds[]) with junction table management
    - Implement deleteSubject(id, name) function
    - Add error code mapping function getSubjectErrorMessage()
    - Ensure all functions return { data, error } structure
    - _Requirements: 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 3.8, 4.4, 5.4_

  - [ ]* 1.4 Write property test for data access function return structure
    - **Property 24: Data Access Function Return Structure**
    - **Validates: Requirements 11.7**
    - Test that all data access functions return objects with 'data' and 'error' properties
    - _Requirements: 11.7_

- [ ] 2. Implement validation logic
  - [ ] 2.1 Create validation functions in subjects.ts
    - Implement validateSubjectName() for length and emptiness checks
    - Implement validateSubjectCode() for pattern matching (lowercase, numbers, underscores)
    - Implement validateSubjectForm() for complete form validation
    - Return validation results with specific error messages for each field
    - _Requirements: 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 2.2 Write property tests for validation logic
    - **Property 6: Subject Name Validation - Minimum Length**
    - **Validates: Requirements 3.4, 6.1**
    - Test that empty, whitespace-only, or strings < 2 chars fail validation
    - _Requirements: 3.4, 6.1_

  - [ ]* 2.3 Write property test for name maximum length validation
    - **Property 7: Subject Name Validation - Maximum Length**
    - **Validates: Requirements 6.2**
    - Test that strings > 100 characters fail validation
    - _Requirements: 6.2_

  - [ ]* 2.4 Write property test for code pattern validation
    - **Property 8: Subject Code Validation Pattern**
    - **Validates: Requirements 3.5, 6.3**
    - Test that codes with invalid characters fail validation
    - _Requirements: 3.5, 6.3_

  - [ ]* 2.5 Write property test for validation preventing submission
    - **Property 18: Validation Prevents Submission**
    - **Validates: Requirements 6.7**
    - Test that forms with validation errors cannot trigger database operations
    - _Requirements: 6.7_

- [ ] 3. Create SubjectCard component
  - [ ] 3.1 Implement SubjectCard component
    - Create components/admin/subjects/SubjectCard.tsx
    - Display subject name, code, class name, and all teacher names
    - Display active status indicator
    - Render edit and delete action buttons (conditional on showActions prop)
    - Apply design system tokens for styling
    - Add accessibility labels and roles
    - _Requirements: 1.2, 1.3, 4.1, 5.1_

  - [ ]* 3.2 Write property test for card display completeness
    - **Property 1: Subject Card Display Completeness**
    - **Validates: Requirements 1.2**
    - Test that all required fields (name, code, class, teachers) are displayed
    - _Requirements: 1.2_

  - [ ]* 3.3 Write property test for active status indicator
    - **Property 2: Active Status Indicator Presence**
    - **Validates: Requirements 1.3**
    - Test that status indicator element is present for any subject
    - _Requirements: 1.3_

  - [ ]* 3.4 Write property test for edit button presence
    - **Property 11: Edit Button Presence**
    - **Validates: Requirements 4.1**
    - Test that edit button appears for admin users
    - _Requirements: 4.1_

  - [ ]* 3.5 Write property test for delete button presence
    - **Property 13: Delete Button Presence**
    - **Validates: Requirements 5.1**
    - Test that delete button appears for admin users
    - _Requirements: 5.1_

- [ ] 4. Create SubjectForm component
  - [ ] 4.1 Implement SubjectForm component
    - Create components/admin/subjects/SubjectForm.tsx
    - Add input fields for name, code, class dropdown, and teacher multi-select
    - Load active classes for dropdown using existing getClasses()
    - Load teachers (role='teacher') for multi-select
    - Implement form state management with useState
    - Apply client-side validation on input change
    - Display validation errors below each field
    - Handle form submission with onSubmit prop
    - Support initialValues prop for edit mode
    - Apply design system styling
    - _Requirements: 3.3, 3.6, 3.7, 4.2, 6.6_

  - [ ]* 4.2 Write property test for class selection validation
    - **Property 15: Class Selection Validation**
    - **Validates: Requirements 6.4**
    - Test that form submission fails without class selected
    - _Requirements: 6.4_

  - [ ]* 4.3 Write property test for teacher selection validation
    - **Property 16: Teacher Selection Validation**
    - **Validates: Requirements 6.5**
    - Test that form submission fails without at least one teacher selected
    - _Requirements: 6.5_

  - [ ]* 4.4 Write property test for validation error specificity
    - **Property 17: Validation Error Message Specificity**
    - **Validates: Requirements 6.6**
    - Test that error messages identify which field failed and why
    - _Requirements: 6.6_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Modify OrganizationManager screen to add Subjects tab
  - [ ] 6.1 Add subjects state and tab type to OrganizationManager
    - Add 'subjects' to TabType union type
    - Add subjects state: useState<SubjectItem[]>([])
    - Add selectedSubject state for edit operations
    - Add subject count to statistics display in header
    - _Requirements: 7.1, 7.3_

  - [ ] 6.2 Implement fetchSubjects function
    - Call getSubjects() from lib/subjects.ts
    - Transform data to include teacher arrays
    - Update subjects state
    - Handle errors with Alert
    - _Requirements: 1.1, 1.6_

  - [ ] 6.3 Add Subjects tab to tab navigation
    - Add "Subjects" tab button alongside Classes, Branches, Departments
    - Update tab selection logic to handle 'subjects' type
    - Ensure consistent styling with existing tabs
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ] 6.4 Implement subject list rendering in Subjects tab
    - Render FlatList of SubjectCard components when activeTab === 'subjects'
    - Implement search filtering by name or code (case-insensitive)
    - Implement sort toggle between name and creation date
    - Add pull-to-refresh functionality
    - Display LoadingSpinner during initial load
    - Display EmptyState when no subjects exist
    - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 12.1, 12.2, 12.3, 12.4_

  - [ ]* 6.5 Write property test for subject list sorting
    - **Property 3: Subject List Sorting**
    - **Validates: Requirements 1.5**
    - Test that sorted list maintains lexicographic order by name
    - _Requirements: 1.5_

  - [ ]* 6.6 Write property test for search filter correctness
    - **Property 4: Search Filter Correctness**
    - **Validates: Requirements 2.2**
    - Test that filtered results only contain matching subjects
    - _Requirements: 2.2_

  - [ ]* 6.7 Write property test for sort toggle state machine
    - **Property 5: Sort Toggle State Machine**
    - **Validates: Requirements 2.4**
    - Test that sort toggle alternates between name and date
    - _Requirements: 2.4_

- [ ] 7. Implement create subject functionality
  - [ ] 7.1 Add create button and modal handling
    - Add create button to Subjects tab header
    - Implement showSubjectForm state for modal visibility
    - Render SubjectForm in bottom sheet modal
    - Handle modal open/close
    - _Requirements: 3.1, 3.2_

  - [ ] 7.2 Implement handleSubjectSubmit for create
    - Call createSubject() with form data including teacherIds array
    - Handle validation errors
    - Display success alert on successful creation
    - Refresh subject list
    - Close modal
    - Handle database errors with user-friendly messages
    - _Requirements: 3.8, 3.9, 3.10, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 7.3 Write property test for create subject persistence
    - **Property 9: Create Subject Database Persistence**
    - **Validates: Requirements 3.8**
    - Test that created subjects can be retrieved from database
    - _Requirements: 3.8_

  - [ ]* 7.4 Write property test for database error mapping
    - **Property 10: Database Error Mapping**
    - **Validates: Requirements 3.10, 10.4**
    - Test that PostgreSQL error codes map to user-friendly messages
    - _Requirements: 3.10, 10.4_

- [ ] 8. Implement edit subject functionality
  - [ ] 8.1 Add edit button handler
    - Implement onEdit handler in SubjectCard
    - Set selectedSubject state with current subject data
    - Load current teacher assignments for the subject
    - Open SubjectForm modal with initialValues including teacherIds
    - _Requirements: 4.1, 4.2_

  - [ ] 8.2 Implement handleSubjectSubmit for update
    - Call updateSubject() with id, updates, and teacherIds array
    - Handle validation errors
    - Display success alert on successful update
    - Refresh subject list
    - Close modal and clear selectedSubject
    - Handle database errors with user-friendly messages
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [ ]* 8.3 Write property test for update subject persistence
    - **Property 12: Update Subject Database Persistence**
    - **Validates: Requirements 4.4**
    - Test that updated subjects reflect changes in subsequent queries
    - _Requirements: 4.4_

- [ ] 9. Implement delete subject functionality
  - [ ] 9.1 Add delete button handler with confirmation
    - Implement onDelete handler in SubjectCard
    - Display confirmation Alert with subject name
    - Warn that action cannot be undone
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 9.2 Implement handleSubjectDelete
    - Call deleteSubject() with subject id and name
    - Display success alert on successful deletion
    - Refresh subject list
    - Handle foreign key constraint errors with specific message
    - Handle other database errors with user-friendly messages
    - _Requirements: 5.4, 5.5, 5.6, 5.7_

  - [ ]* 9.3 Write property test for delete subject removal
    - **Property 14: Delete Subject Database Removal**
    - **Validates: Requirements 5.4**
    - Test that deleted subjects are not returned in subsequent queries
    - _Requirements: 5.4_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement teacher subject view
  - [ ] 11.1 Add getSubjectsByTeacher query to teacher dashboard/profile
    - Call getSubjectsByTeacher(teacherId) in teacher screens
    - Display subject cards with name, code, class, and all assigned teachers
    - Ensure read-only display (no action buttons)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 11.2 Write property test for teacher subject filtering
    - **Property 19: Teacher Subject Filtering**
    - **Validates: Requirements 8.1**
    - Test that teachers only see subjects they're assigned to
    - _Requirements: 8.1_

  - [ ]* 11.3 Write property test for teacher role action button hiding
    - **Property 20: Teacher Role Action Button Hiding**
    - **Validates: Requirements 8.3**
    - Test that teacher users don't see create/edit/delete buttons
    - _Requirements: 8.3_

- [ ] 12. Implement student subject access
  - [ ] 12.1 Add getSubjectsByClass query to student dashboard
    - Call getSubjectsByClass(classId) in student screens
    - Display subject cards with name, code, and all assigned teachers
    - Ensure read-only display (no action buttons)
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 13. Apply design system and theme support
  - [ ] 13.1 Apply design tokens to all subject components
    - Use tokens.colors for all color values
    - Use tokens.spacing for padding and margins
    - Use tokens.typography for text styles
    - Implement getSurfaceColor(), getTextColor(), getBackgroundColor() from theme
    - Support both light and dark modes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 13.2 Write property test for theme mode support
    - **Property 21: Theme Mode Support**
    - **Validates: Requirements 9.2**
    - Test that components render without errors in both light and dark modes
    - _Requirements: 9.2_

  - [ ]* 13.3 Write property test for loading state indicator
    - **Property 22: Loading State Indicator**
    - **Validates: Requirements 9.6, 10.1**
    - Test that loading indicator is visible during database operations
    - _Requirements: 9.6, 10.1_

  - [ ]* 13.4 Write property test for success feedback display
    - **Property 23: Success Feedback Display**
    - **Validates: Requirements 10.2**
    - Test that success messages are displayed after successful operations
    - _Requirements: 10.2_

- [ ] 14. Add accessibility features
  - [ ] 14.1 Add accessibility labels and roles to all interactive elements
    - Add accessibilityRole and accessibilityLabel to all buttons
    - Add accessibilityHint to action buttons
    - Ensure form inputs have proper labels
    - Ensure error messages are announced to screen readers
    - Test with screen reader (TalkBack/VoiceOver)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 15. Final integration and testing
  - [ ] 15.1 Update type definitions and navigation
    - Add SubjectManager to RootStackParamList in lib/types.ts (if creating separate screen)
    - Verify all TypeScript types are correct
    - Run TypeScript compiler to check for errors
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 15.2 Run all unit tests and property tests
    - Execute all test files
    - Verify all 24 properties pass
    - Fix any failing tests
    - Ensure test coverage meets requirements
    - _Requirements: All_

  - [ ] 15.3 Manual testing of complete user flows
    - Test create subject flow with multiple teachers
    - Test edit subject flow with teacher reassignment
    - Test delete subject flow with confirmation
    - Test search and filter functionality
    - Test sort toggle functionality
    - Test pull-to-refresh
    - Test empty state display
    - Test error handling scenarios
    - Test teacher view (read-only)
    - Test student view (class-based filtering)
    - Test both light and dark themes
    - _Requirements: All_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- The implementation follows the established FRAMS architecture pattern
- All database operations use the Supabase client with RLS policies
- The feature integrates into the existing OrganizationManager screen as a fourth tab
- Many-to-many teacher-subject relationships are managed via the subject_teachers junction table
