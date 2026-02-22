K# Implementation Plan

- [-] 1. Implement keyboard-aware form handling



  - Create KeyboardAwareScrollView wrapper component that automatically scrolls to focused inputs
  - Update ScrollView and KeyboardAvoidingView configuration in existing forms
  - Handle platform-specific keyboard behavior (iOS vs Android)
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 1.1 Write property test for keyboard scroll behavior


  - **Property 1: Focused input visibility**
  - **Validates: Requirements 1.1, 1.5**


- [x] 1.2 Write property test for keyboard dismissal

  - **Property 2: Keyboard dismissal restores scroll position**
  - **Validates: Requirements 1.3**
-

- [x] 2. Implement screenshot and screen recording prevention




  - Research and implement platform-specific screenshot prevention (FLAG_SECURE for Android, secure field overlay for iOS)
  - Create ScreenshotPrevention service module
  - Initialize screenshot prevention on app startup
  - Handle platform differences and graceful degradation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Write example tests for screenshot prevention


  - Test Android screenshot prevention
  - Test iOS screenshot prevention
  - Test silent prevention (no error messages)
  - Test background state prevention
  - Test screen recording prevention
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
-

- [-] 3. Create enhanced dropdown picker component


  - Build EnhancedPicker component with proper controlled state management
  - Implement value display fix to show selected values correctly
  - Add visual feedback for selection changes
  - Implement search/filter functionality for dropdowns with many options
  - Add error state support and accessibility features
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.3, 4.4, 4.6_

- [ ] 3.1 Write property test for dropdown selection display


  - **Property 3: Dropdown selection display**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

- [ ] 3.2 Write property test for dropdown persistence
  - **Property 4: Dropdown persistence round-trip**
  - **Validates: Requirements 3.4**

- [x] 3.3 Write property test for search functionality

  - **Property 5: Search functionality for large lists**
  - **Validates: Requirements 4.4**

- [ ] 3.4 Write unit tests for EnhancedPicker component
  - Test selection callbacks
  - Test error state rendering
  - Test accessibility features
  - _Requirements: 3.1, 3.2, 3.3, 4.3, 4.6_
-

- [x] 4. Update existing forms to use EnhancedPicker




  - Replace Picker usage in SignUpScreen with EnhancedPicker
  - Replace Picker usage in UserManagement screen with EnhancedPicker
  - Replace Picker usage in any other forms with dropdowns
  - Verify selected values display correctly in all forms
  - _Requirements: 3.1, 3.2, 3.3, 3.5_




- [ ] 5. Create database schema for organizational data

  - Create classes table with proper constraints and indexes
  - Create branches table with class_id foreign key
  - Create departments table with proper constraints



  - Add RLS policies for admin-only write access
  - Add indexes for performance optimization
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 6. Implement organization service layer

  - Create OrganizationService with CRUD methods for classes
  - Implement CRUD methods for branches with class association


  - Implement CRUD methods for departments
  - Add validation logic for all operations

  - Implement dependency checking for safe deletion
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 5.9_


- [ ] 6.1 Write property test for organizational item creation
  - **Property 6: Organizational item creation and availability**
  - **Validates: Requirements 5.2, 5.4**


- [ ] 6.2 Write property test for branch-class filtering
  - **Property 7: Branch-class association filtering**


  - **Validates: Requirements 5.3, 5.7**


- [ ] 6.3 Write property test for update propagation
  - **Property 8: Organizational item updates propagate**
  - **Validates: Requirements 5.5, 5.6**

- [ ] 6.4 Write property test for deletion prevention
  - **Property 9: Deletion prevention for items in use**
  - **Validates: Requirements 5.8**

- [ ] 6.5 Write unit tests for OrganizationService
  - Test validation logic


  - Test error handling
  - Test RLS policy enforcement

  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 5.9_

- [x] 7. Create admin organization management UI



  - Create OrganizationManager screen with tabbed interface for classes, branches, and departments
  - Implement list view for each organizational type
  - Add create/edit/delete forms for classes
  - Add create/edit/delete forms for branches with class selection
  - Add create/edit/delete forms for departments
  - Implement confirmation dialogs for delete operations
  - Add navigation from admin dashboard to organization manager
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.10_

- [x] 7.1 Write property test for complete item display

  - **Property 10: Complete organizational item display**
  - **Validates: Requirements 5.10**

- [x] 7.2 Write unit tests for OrganizationManager UI

  - Test form validation
  - Test delete confirmation flow
  - Test error message display
  - _Requirements: 5.1, 5.6, 5.8_
-

- [x] 8. Migrate existing hardcoded data to database




  - Write migration script to populate classes table from CLASS_LEVELS constant
  - Write migration script to populate branches table from BRANCHES constant
  - Write migration script to populate departments table from DEPARTMENTS constant
  - Verify data integrity after migration
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 9. Update forms to use database-driven dropdowns




  - Update SignUpScreen to fetch classes, branches, and departments from database
  - Update UserManagement screen to fetch organizational data from database
  - Implement branch filtering based on selected class
  - Add loading states for dropdown data fetching
  - Add error handling for data fetch failures
  - _Requirements: 3.1, 3.2, 3.3, 5.3, 5.7_

- [x] 10. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.
-

- [x] 11. Integration testing
 
  - Test complete admin workflow: create class → create branch for class → verify in signup form
  - Test branch filtering: select class → verify only associated branches appear
  - Test deletion prevention: create user with class/branch → attempt to delete → verify prevention
  - Test update propagation: edit organizational item → verify changes in all dropdowns
  - _Requirements: 5.2, 5.3, 5.5, 5.6, 5.7, 5.8_

- [x] 12. Final polish and documentation


  - Add inline code documentation for new components
  - Update README with new admin features
  - Add error handling and user feedback for all operations
  - Verify accessibility compliance for all new components
  - Test on physical devices (Android and iOS)
  - _Requirements: All_
