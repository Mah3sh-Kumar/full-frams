# Implementation Plan

## Phase 1: Explore Bug Condition

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Last Option Fully Visible
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Fault Condition in design:
    - Render SelectPicker modal with 8 department options
    - Render SelectPicker modal with 5 class level options
    - Render SelectPicker modal with 15+ options and scroll to bottom
    - Verify all options, especially the last one, are fully visible within modal boundaries
    - Verify adequate bottom padding exists below the last item
    - Verify no overlap with system navigation on small screens
  - The test assertions should match the Expected Behavior Properties from design:
    - `allOptionsFullyVisible(result) === true`
    - `lastItemHasBottomPadding(result) === true`
    - `noOverlapWithSystemNavigation(result) === true`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Last list item is partially cut off or hidden at the modal boundary
    - No visible padding below the last item
    - Possible overlap with system navigation on small screens
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.4_

## Phase 2: Preserve Existing Behavior

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Selection and Search Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (selection, search, modal close)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Selection functionality: tapping any option triggers `onValueChange` and closes modal
    - Search functionality: filtering options by label/description works correctly
    - Modal close behavior: tapping close button or overlay closes modal without affecting form state
    - Visual styling: list item icons, text, descriptions, and selected state remain unchanged
    - Modal appearance: width and overall appearance consistent across screen sizes
    - Empty state: display works when no items match search query
  - Property-based testing generates many test cases for stronger guarantees:
    - Generate random numbers of options (1-50) and verify selection works for any option
    - Generate random search queries and verify filtering works correctly
    - Generate random screen sizes and verify modal appearance remains consistent
    - Test that modal close works correctly regardless of list size or search state
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 3: Implement Fix

- [x] 3. Fix for SelectPicker list container layout issue

  - [x] 3.1 Implement the fix
    - Add bottom padding to listContainer: `paddingBottom: 16`
    - Replace fixed height with responsive max-height approach
    - Adjust modalContent max-height to accommodate header, search, and list with proper padding
    - Add FlatList content inset or contentContainerStyle for bottom spacing
    - Use Dimensions API or percentage-based sizing for responsive behavior across screen sizes
    - Verify changes in `FRAMS/components/design-system/primitives/SelectPicker.tsx` (line 233 for listContainer, line 195 for modalContent)
    - _Bug_Condition: isBugCondition(input) where listContainerHeight == 300 AND listContainerPaddingBottom == 0 AND lastItemPartiallyHidden == true_
    - _Expected_Behavior: allOptionsFullyVisible(result) AND lastItemHasBottomPadding(result) AND noOverlapWithSystemNavigation(result)_
    - _Preservation: Selection, search, modal close, visual styling, and modal appearance must remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Last Option Fully Visible
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify all options are fully visible with adequate bottom padding
    - Verify no overlap with system navigation
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Selection and Search Functionality
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - Verify selection, search, modal close, and visual styling remain unchanged
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 4: Checkpoint

- [x] 4. Checkpoint - Ensure all tests pass
  - Verify all exploration tests pass (Property 1: Fault Condition → Expected Behavior)
  - Verify all preservation tests pass (Property 2: Preservation)
  - Confirm no regressions in selection, search, or modal functionality
  - Verify visual consistency across different screen sizes
  - Ensure system navigation is not overlapped by modal
  - Mark complete when all tests pass and fix is validated
