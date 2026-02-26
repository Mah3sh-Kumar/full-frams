# Implementation Plan

## Bug Condition Exploration & Preservation Testing

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Sidebar Remains Visible After Loading
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For this deterministic bug, scope the property to the concrete failing case: loading=false with any valid admin state
  - Test implementation details from Fault Condition in design:
    - Render AdminDashboard component with loading=false (data loaded state)
    - Assert that the sidebar is visible and rendered within AdminLayout
    - Assert that sidebar menu items are present and clickable
    - Assert that dashboard content is rendered alongside the sidebar
  - The test assertions should match the Expected Behavior Properties from design (Requirements 2.1, 2.2)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "Sidebar not visible when loading=false", "AdminLayout wrapper missing from main return")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Loading State and Dashboard Content Rendering
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (loading=true state):
    - Verify loading indicator displays correctly
    - Verify sidebar is visible during loading state
    - Verify dashboard content structure is correct
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Test that loading indicator displays when loading=true
    - Test that sidebar is visible when loading=true
    - Test that dashboard content renders correctly when loading=false (content structure, not sidebar visibility)
    - Test that navigation handlers are properly connected
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

## Implementation

- [x] 3. Fix sidebar disappearing by wrapping main return with AdminLayout

  - [x] 3.1 Implement the fix
    - Modify `FRAMS/screens/admin/AdminDashboard.tsx` main return statement (lines 224+)
    - Wrap the main return statement with AdminLayout component instead of plain View
    - Pass AdminLayout props: activeMenuItem="dashboard", onMenuItemPress={handleMenuItemPress}, onLogout={handleLogout}, userName={adminName}, userEmail={session?.user?.email || ''}
    - Move StatusBar, welcomeSection, and scrollContainer inside AdminLayout as children
    - Replace closing `</View>` with `</AdminLayout>`
    - Maintain all existing styles, content, and functionality
    - _Bug_Condition: loading = false AND mainReturnStatement does not wrap content in AdminLayout_
    - _Expected_Behavior: Sidebar remains visible by wrapping main return with AdminLayout (Requirements 2.1, 2.2)_
    - _Preservation: Loading indicator display, dashboard content rendering, navigation functionality unchanged (Requirements 3.1, 3.2, 3.3)_
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Sidebar Remains Visible After Loading
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify sidebar is visible when loading=false
    - Verify sidebar menu items are clickable
    - Verify dashboard content renders correctly
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Loading State and Dashboard Content Rendering
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm loading indicator still displays correctly
    - Confirm sidebar is visible during loading state
    - Confirm dashboard content renders correctly
    - Confirm navigation functionality works as expected
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Checkpoint - Ensure all tests pass
  - Verify all exploration tests pass (Property 1: Expected Behavior)
  - Verify all preservation tests pass (Property 2: Preservation)
  - Confirm no regressions in existing functionality
  - Confirm sidebar remains visible throughout component lifecycle
  - Ensure all tests pass, ask the user if questions arise
