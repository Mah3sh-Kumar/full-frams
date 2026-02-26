# Implementation Plan

## Phase 1: Explore Bug Condition

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Keyboard Obscures Input Fields in Modals
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Fault Condition in design:
    - Simulate focusing on input fields in Create Department modal when keyboard is visible
    - Simulate focusing on input fields in Create Branch modal when keyboard is visible
    - Verify that input fields remain visible above the keyboard with adequate padding
    - Test on small screen scenario (720×1480) where keyboard takes up 40-50% of screen height
  - The test assertions should match the Expected Behavior Properties from design:
    - Assert that focused input field is visible (not obscured by keyboard)
    - Assert that focused input field is positioned above the keyboard
    - Assert that padding between input field and keyboard is at least 100 points
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Record which input fields are obscured
    - Record keyboard height and screen dimensions
    - Record scroll position before and after keyboard appearance
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

## Phase 2: Preserve Existing Behavior

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Modal Animations, Styling, and Non-Keyboard Interactions
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (where isBugCondition returns false):
    - Modal open/close animations work smoothly without visual artifacts
    - Create and Cancel buttons respond to taps correctly
    - Focus management transitions between fields work as expected
    - Keyboard dismissal does not cause layout shifts or glitches
    - Modal styling, colors, and typography remain consistent
    - Non-input element interactions (labels, text, buttons) work normally
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Test that modal animations complete without interruption across multiple open/close cycles
    - Test that button interactions (Create, Cancel) work consistently across different modal states
    - Test that focus transitions between input fields work correctly without side effects
    - Test that keyboard dismissal preserves layout and styling
    - Test that non-keyboard interactions produce consistent results
  - Property-based testing generates many test cases for stronger guarantees:
    - Generate random sequences of button taps and verify consistent behavior
    - Generate random modal open/close cycles and verify animations remain smooth
    - Generate random focus transitions and verify no layout shifts occur
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

## Phase 3: Implement Fix

- [x] 3. Fix keyboard obscuring input fields in Organization Manager modals

  - [x] 3.1 Implement the fix
    - Import KeyboardAwareScrollView from `react-native-keyboard-aware-scroll-view` in OrganizationManager.tsx
    - Replace ScrollView with KeyboardAwareScrollView in both Create Department and Create Branch modals
    - Configure extraScrollHeight prop with value 120 to ensure adequate padding between input field and keyboard
    - Verify keyboard props are correctly set:
      - `keyboardShouldPersistTaps="handled"` - allows tapping on non-input elements without dismissing keyboard
      - `enableOnAndroid={true}` - ensures component works on Android devices
      - `scrollEnabled={true}` - allows scrolling when content exceeds screen height
    - Maintain all existing props on KeyboardAwareScrollView (e.g., contentContainerStyle, style, showsVerticalScrollIndicator)
    - _Bug_Condition: isBugCondition(input) where input.targetComponent IN ['CreateDepartmentModal', 'CreateBranchModal'] AND input.eventType == 'focus' AND currentScrollViewType == 'ScrollView' AND keyboardIsVisible == true_
    - _Expected_Behavior: For any input where bug condition holds, form automatically scrolls to keep focused input field visible above keyboard with adequate padding (extraScrollHeight >= 100)_
    - _Preservation: Modal animations, styling, focus management, and non-keyboard interactions must remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Keyboard Does Not Obscure Input Fields
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1 on FIXED code
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify that:
      - Input fields remain visible when focused with keyboard present
      - Adequate padding exists between input field and keyboard
      - Form scrolls correctly on small screens (720×1480)
      - Both Create Department and Create Branch modals work correctly
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Modal Animations, Styling, and Non-Keyboard Interactions
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2 on FIXED code
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions):
      - Modal animations continue to work smoothly
      - Button interactions remain consistent
      - Focus management works as before
      - Keyboard dismissal does not cause layout shifts
      - Non-keyboard interactions produce same results
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

## Phase 4: Checkpoint

- [x] 4. Checkpoint - Ensure all tests pass
  - Verify all exploration tests pass (Property 1: Expected Behavior)
  - Verify all preservation tests pass (Property 2: Preservation)
  - Verify no regressions in existing functionality
  - Test on small screens (720×1480) to confirm keyboard doesn't obscure inputs
  - Test on both Create Department and Create Branch modals
  - Confirm fix is complete and ready for review
