# Requirements Document

## Introduction

This document defines the requirements for adding Subject Management as a fourth tab in the OrganizationManager screen of the FRAMS mobile application. The feature will enable administrators to create, view, update, and delete subjects within the academic system. Subjects represent courses or academic disciplines taught within classes, with many-to-many relationships to teachers. Students access subjects through their class assignments.

## Glossary

- **Organization_Manager**: The mobile application screen responsible for managing organizational data including classes, branches, departments, and subjects
- **Subject_Tab**: The fourth tab in the Organization_Manager for managing subjects
- **Subject**: An academic course or discipline (e.g., Mathematics, Physics) with a unique code, name, and associations to classes and multiple teachers
- **Admin**: A user with administrative privileges who can perform all subject management operations
- **Teacher**: A user with teaching privileges who can be assigned to teach multiple subjects
- **Class**: An academic class/grade level (e.g., "Class 10", "First Year") that subjects are associated with
- **Subject_Code**: A unique lowercase identifier for a subject (e.g., "math_101", "physics_advanced")
- **Subject_List**: The display of all subjects in the system with their details
- **Subject_Form**: The user interface for creating or editing subject information
- **Subject_Teachers_Junction**: The database table managing many-to-many relationships between subjects and teachers
- **Database**: The Supabase PostgreSQL database containing the subjects and subject_teachers tables

## Requirements

### Requirement 1: View Subject List in Organization Manager

**User Story:** As an admin, I want to view all subjects in the Subjects tab, so that I can see what courses are available.

#### Acceptance Criteria

1. WHEN an admin navigates to the Organization_Manager and selects the Subjects tab, THE Organization_Manager SHALL display a list of all subjects
2. FOR EACH subject in the Subject_List, THE Organization_Manager SHALL display the subject name, subject code, associated class name, and all assigned teacher names
3. THE Organization_Manager SHALL display an active status indicator for each subject
4. WHEN the Subject_List is empty, THE Organization_Manager SHALL display an empty state message
5. THE Organization_Manager SHALL sort subjects by name in ascending order by default
6. THE Organization_Manager SHALL load subject data from the Database subjects table with joins to classes, users, and subject_teachers tables

### Requirement 2: Search and Filter Subjects

**User Story:** As an admin, I want to search and filter subjects, so that I can quickly find specific courses.

#### Acceptance Criteria

1. THE Organization_Manager SHALL provide a search input field in the Subjects tab
2. WHEN a user enters text in the search field, THE Organization_Manager SHALL filter subjects by name or code containing the search text
3. THE Organization_Manager SHALL provide a sort toggle button
4. WHEN a user activates the sort toggle, THE Organization_Manager SHALL alternate between sorting by name and sorting by creation date
5. THE Organization_Manager SHALL perform search filtering in a case-insensitive manner

### Requirement 3: Create New Subject

**User Story:** As an admin, I want to create new subjects, so that I can add courses to the academic system.

#### Acceptance Criteria

1. THE Organization_Manager SHALL provide a create button accessible from the Subjects tab
2. WHEN an admin activates the create button, THE Organization_Manager SHALL display the Subject_Form as a bottom sheet modal
3. THE Subject_Form SHALL include input fields for subject name, subject code, class selection, and teacher multi-selection
4. THE Subject_Form SHALL validate that the subject name is at least 2 characters and not empty
5. THE Subject_Form SHALL validate that the subject code contains only lowercase letters, numbers, and underscores
6. THE Subject_Form SHALL provide a dropdown of active classes for class selection
7. THE Subject_Form SHALL provide a multi-select interface for selecting one or more teachers with teacher role
8. WHEN the admin submits valid subject data, THE Organization_Manager SHALL insert a new record into the Database subjects table and create corresponding records in the subject_teachers junction table
9. WHEN the subject is created successfully, THE Organization_Manager SHALL display a success message and refresh the Subject_List
10. IF the Database returns an error, THE Organization_Manager SHALL display a user-friendly error message

### Requirement 4: Edit Existing Subject

**User Story:** As an admin, I want to edit existing subjects, so that I can update course information when needed.

#### Acceptance Criteria

1. FOR EACH subject in the Subject_List, THE Organization_Manager SHALL provide an edit action button
2. WHEN an admin activates the edit button, THE Organization_Manager SHALL display the Subject_Form pre-populated with the subject's current data including all assigned teachers
3. THE Subject_Form SHALL apply the same validation rules as subject creation
4. WHEN the admin submits updated subject data, THE Organization_Manager SHALL update the corresponding record in the Database subjects table and update the subject_teachers junction table
5. WHEN the subject is updated successfully, THE Organization_Manager SHALL display a success message and refresh the Subject_List
6. IF the Database returns an error, THE Organization_Manager SHALL display a user-friendly error message

### Requirement 5: Delete Subject

**User Story:** As an admin, I want to delete subjects, so that I can remove courses that are no longer offered.

#### Acceptance Criteria

1. FOR EACH subject in the Subject_List, THE Organization_Manager SHALL provide a delete action button
2. WHEN an admin activates the delete button, THE Organization_Manager SHALL display a confirmation dialog
3. THE confirmation dialog SHALL display the subject name and warn that the action cannot be undone
4. WHEN the admin confirms deletion, THE Organization_Manager SHALL delete the record from the Database subjects table and all associated records from the subject_teachers junction table
5. WHEN the subject is deleted successfully, THE Organization_Manager SHALL display a success message and refresh the Subject_List
6. IF the Database returns a foreign key constraint error, THE Organization_Manager SHALL display a message indicating the subject is in use by attendance or assignments
7. IF the Database returns any other error, THE Organization_Manager SHALL display a user-friendly error message

### Requirement 6: Subject Data Validation

**User Story:** As an admin, I want subject data to be validated, so that I can ensure data quality and consistency.

#### Acceptance Criteria

1. THE Organization_Manager SHALL validate that subject name is not empty and is at least 2 characters long
2. THE Organization_Manager SHALL validate that subject name does not exceed 100 characters
3. THE Organization_Manager SHALL validate that subject code matches the pattern of lowercase letters, numbers, and underscores only
4. THE Organization_Manager SHALL validate that a class is selected before submission
5. THE Organization_Manager SHALL validate that at least one teacher is selected before submission
6. WHEN validation fails, THE Organization_Manager SHALL display specific error messages for each validation failure
7. WHEN validation fails, THE Organization_Manager SHALL prevent form submission

### Requirement 7: Tab Integration in Organization Manager

**User Story:** As an admin, I want to access subject management from the Organization Manager, so that I can manage all organizational data in one place.

#### Acceptance Criteria

1. THE Organization_Manager SHALL provide a fourth tab labeled "Subjects" alongside Classes, Branches, and Departments tabs
2. WHEN an admin selects the Subjects tab, THE Organization_Manager SHALL display the Subject_List
3. THE Organization_Manager SHALL display a statistics counter showing the total number of subjects in the header
4. THE Organization_Manager SHALL maintain consistent UI patterns with the existing Classes, Branches, and Departments tabs

### Requirement 8: Teacher Subject View

**User Story:** As a teacher, I want to view all subjects I teach, so that I can see what courses I am assigned to.

#### Acceptance Criteria

1. WHEN a teacher views their profile or dashboard, THE application SHALL display all subjects where the teacher is assigned through the subject_teachers junction table
2. THE application SHALL display the subject name, code, and associated class for each subject
3. THE application SHALL provide read-only access to subject information for teachers
4. THE application SHALL allow teachers to see all other teachers assigned to the same subject

### Requirement 9: Responsive UI Design

**User Story:** As a user, I want the subject management interface to be visually consistent with the rest of the app, so that I have a seamless experience.

#### Acceptance Criteria

1. THE Organization_Manager SHALL use the application's design system tokens for colors, spacing, and typography in the Subjects tab
2. THE Organization_Manager SHALL support both light and dark theme modes
3. THE Organization_Manager SHALL use the role-based color scheme with admin primary color for the header
4. THE Organization_Manager SHALL display subjects in card format with rounded corners and shadows matching the Classes, Branches, and Departments tabs
5. THE Organization_Manager SHALL use the bottom sheet modal pattern for the Subject_Form
6. THE Organization_Manager SHALL provide visual feedback for loading states using LoadingSpinner
7. THE Organization_Manager SHALL provide visual feedback for empty states using EmptyState component

### Requirement 10: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback on my actions, so that I understand what is happening in the system.

#### Acceptance Criteria

1. WHEN a database operation is in progress, THE Organization_Manager SHALL display a loading indicator
2. WHEN a database operation succeeds, THE Organization_Manager SHALL display a success alert with a descriptive message
3. WHEN a database operation fails, THE Organization_Manager SHALL display an error alert with a user-friendly message
4. THE Organization_Manager SHALL map PostgreSQL error codes to user-friendly messages
5. WHEN a duplicate subject code is detected (error code 23505), THE Organization_Manager SHALL display "A subject with this code already exists"
6. WHEN a foreign key constraint fails (error code 23503), THE Organization_Manager SHALL display "Invalid reference - the associated item does not exist"
7. WHEN a required field is missing (error code 23502), THE Organization_Manager SHALL display "Required field is missing"

### Requirement 11: Data Access Layer

**User Story:** As a developer, I want a clean data access layer for subjects, so that database operations are consistent and maintainable.

#### Acceptance Criteria

1. THE Organization_Manager SHALL implement a subjects.ts module in the lib directory
2. THE subjects.ts module SHALL export a SubjectItem interface with id, name, code, class_id, is_active, created_at, and updated_at fields
3. THE subjects.ts module SHALL export a getSubjects function that accepts optional includeInactive parameter and returns subjects with their assigned teachers
4. THE subjects.ts module SHALL export a createSubject function that accepts name, code, classId, and teacherIds array parameters
5. THE subjects.ts module SHALL export an updateSubject function that accepts id, updates object, and teacherIds array
6. THE subjects.ts module SHALL export a deleteSubject function that accepts id and name parameters
7. THE subjects.ts module SHALL export functions to manage the subject_teachers junction table
8. ALL subject data access functions SHALL return objects with data and error properties
9. ALL subject data access functions SHALL handle errors and convert them to user-friendly messages

### Requirement 12: Pull-to-Refresh

**User Story:** As a user, I want to refresh the subject list, so that I can see the latest data without leaving the tab.

#### Acceptance Criteria

1. THE Organization_Manager SHALL implement pull-to-refresh functionality on the Subject_List in the Subjects tab
2. WHEN a user performs a pull-down gesture, THE Organization_Manager SHALL reload subject data from the Database
3. WHILE refreshing, THE Organization_Manager SHALL display a refresh indicator
4. WHEN the refresh completes, THE Organization_Manager SHALL hide the refresh indicator and update the Subject_List

### Requirement 13: Student Subject Access

**User Story:** As a student, I want to see subjects for my class, so that I can access course materials and assignments.

#### Acceptance Criteria

1. WHEN a student views their dashboard or course list, THE application SHALL display all subjects associated with the student's assigned class
2. THE application SHALL retrieve subjects by querying the subjects table filtered by the class_id matching the student's class assignment
3. THE application SHALL display all teachers assigned to each subject
4. THE application SHALL not provide students with access to create, edit, or delete subjects
