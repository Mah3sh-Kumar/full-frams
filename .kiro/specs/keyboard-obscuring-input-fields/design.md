# Keyboard Obscuring Input Fields Bugfix Design

## Overview

The Create Department and Create Branch modals in the Organization Manager screen have a critical usability issue where the keyboard obscures input fields when typing. The root cause is that these modals use a regular ScrollView instead of KeyboardAwareScrollView, which prevents the form from automatically adjusting when the keyboard appears. The fix involves replacing ScrollView with KeyboardAwareScrollView and configuring appropriate padding (extraScrollHeight) to ensure input fields remain visible and usable on mobile devices with limited screen space.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a user focuses on an input field in a modal that uses regular ScrollView instead of KeyboardAwareScrollView
- **Property (P)**: The desired behavior when the bug condition occurs - the form should automatically scroll to keep the focused input field visible above the keyboard with adequate padding
- **Preservation**: Existing modal animations, styling, focus management, and non-keyboard interactions that must remain unchanged by the fix
- **KeyboardAwareScrollView**: A React Native component from `react-native-keyboard-aware-scroll-view` that automatically adjusts scroll position when the keyboard appears
- **extraScrollHeight**: Configuration property that adds additional padding between the focused input field and the keyboard (typically 100-150 points)
- **OrganizationManager.tsx**: The component file in `src/screens/OrganizationManager.tsx` that contains the Create Department and Create Branch modals
- **ScrollView**: The standard React Native ScrollView component that does not respond to keyboard appearance events

## Bug Details

### Fault Condition

The bug manifests when a user focuses on an input field in either the Create Department or Create Branch modal. The modal uses a regular ScrollView instead of KeyboardAwareScrollView, which means the form does not automatically adjust its scroll position when the keyboard appears. This causes the keyboard to overlap and obscure the focused input field, making it invisible and unusable.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type FocusEvent
  OUTPUT: boolean
  
  RETURN input.targetComponent IN ['CreateDepartmentModal', 'CreateBranchModal']
         AND input.targetElement IN ['departmentNameInput', 'branchNameInput', 'addressInput', 'phoneInput']
         AND input.eventType == 'focus'
         AND currentScrollViewType == 'ScrollView'
         AND keyboardIsVisible == true
END FUNCTION
```

### Examples

- **Example 1 - Create Department Modal**: User taps the "Department Name" input field on a small screen (720×1480). The keyboard appears and completely obscures the input field. User cannot see what they're typing.

- **Example 2 - Create Branch Modal**: User taps the "Branch Name" input field. The keyboard appears and overlaps the input, making it invisible. User must dismiss keyboard to see the field again.

- **Example 3 - Multiple Fields**: User fills in "Department Name", then taps "Address" field. The keyboard appears and obscures the "Address" field. User cannot see the field or verify their input.

- **Edge Case - Small Screen**: On a 720×1480 screen, the keyboard takes up approximately 40-50% of the screen height. Without KeyboardAwareScrollView, the form cannot scroll to compensate, leaving input fields completely hidden.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Modal open/close animations must continue to work smoothly without any visual artifacts
- Non-input elements (buttons, labels, text) must continue to display and function normally
- Focus management and field validation must continue to work as before
- Keyboard dismissal must not cause layout shifts or visual glitches
- Modal styling, colors, and typography must remain unchanged
- The `keyboardShouldPersistTaps="handled"` behavior must be maintained

**Scope:**
All inputs that do NOT involve focusing on input fields in the modals should be completely unaffected by this fix. This includes:
- Tapping buttons (Create, Cancel)
- Reading labels and static text
- Scrolling the form manually
- Dismissing the keyboard via the keyboard's dismiss button
- Opening and closing the modal
- Navigating between different screens

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Incorrect ScrollView Component**: The modal forms are using React Native's standard ScrollView instead of KeyboardAwareScrollView from the `react-native-keyboard-aware-scroll-view` library. The standard ScrollView does not listen to keyboard appearance events and therefore cannot adjust scroll position automatically.

2. **Missing Keyboard Configuration**: Even if KeyboardAwareScrollView is used, it may not be properly configured with the `extraScrollHeight` property, which adds padding between the focused input and the keyboard to ensure visibility.

3. **Incorrect Keyboard Behavior Props**: The component may be missing or have incorrect values for keyboard-related props like `keyboardShouldPersistTaps` or `enableOnAndroid`.

4. **Library Not Imported**: The `react-native-keyboard-aware-scroll-view` library may not be installed or imported in the OrganizationManager.tsx file.

## Correctness Properties

Property 1: Fault Condition - Keyboard Does Not Obscure Input Fields

_For any_ input where a user focuses on an input field in the Create Department or Create Branch modal (isBugCondition returns true), the fixed component SHALL automatically scroll the form to keep the focused input field visible above the keyboard with adequate padding (extraScrollHeight), ensuring the user can see and interact with the field.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Keyboard Interactions and Modal Behavior

_For any_ input that does NOT involve focusing on input fields in the modals (isBugCondition returns false), the fixed component SHALL produce exactly the same behavior as the original component, preserving all existing functionality for modal animations, styling, focus management, and non-keyboard interactions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/screens/OrganizationManager.tsx`

**Component**: `CreateDepartmentModal` and `CreateBranchModal` (or the shared modal component if they use one)

**Specific Changes**:

1. **Import KeyboardAwareScrollView**: Add import statement for KeyboardAwareScrollView from `react-native-keyboard-aware-scroll-view` library at the top of the file
   - Replace: `import { ScrollView } from 'react-native'`
   - With: `import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'`

2. **Replace ScrollView with KeyboardAwareScrollView**: In both modal components, replace the `<ScrollView>` component with `<KeyboardAwareScrollView>`
   - Update the opening tag from `<ScrollView>` to `<KeyboardAwareScrollView>`
   - Update the closing tag from `</ScrollView>` to `</KeyboardAwareScrollView>`

3. **Configure extraScrollHeight**: Add the `extraScrollHeight` prop to KeyboardAwareScrollView with a value of 100-150 points to provide adequate padding between the input field and keyboard
   - Add: `extraScrollHeight={120}`

4. **Maintain Keyboard Props**: Ensure the following props are present and correctly configured:
   - `keyboardShouldPersistTaps="handled"` - allows tapping on non-input elements without dismissing keyboard
   - `enableOnAndroid={true}` - ensures the component works on Android devices
   - `scrollEnabled={true}` - allows scrolling when content exceeds screen height

5. **Verify No Breaking Changes**: Ensure all existing props on the ScrollView are maintained on KeyboardAwareScrollView (e.g., `contentContainerStyle`, `style`, `showsVerticalScrollIndicator`)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate keyboard appearance events and input field focus in both modals. Run these tests on the UNFIXED code to observe failures and understand the root cause. Verify that the form does not scroll to keep the input field visible.

**Test Cases**:
1. **Create Department Modal - Focus Input**: Simulate focusing on the "Department Name" input field when keyboard is visible (will fail on unfixed code - input will be obscured)
2. **Create Branch Modal - Focus Input**: Simulate focusing on the "Branch Name" input field when keyboard is visible (will fail on unfixed code - input will be obscured)
3. **Multiple Fields - Sequential Focus**: Simulate focusing on multiple input fields in sequence (will fail on unfixed code - fields will be obscured)
4. **Small Screen Scenario**: Simulate keyboard appearance on a 720×1480 screen (will fail on unfixed code - significant portion of form will be hidden)

**Expected Counterexamples**:
- Input fields are not visible when focused with keyboard present
- Form does not scroll to accommodate keyboard
- Possible causes: ScrollView instead of KeyboardAwareScrollView, missing extraScrollHeight configuration, incorrect keyboard behavior props

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed component produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedModal(input)
  ASSERT result.inputFieldIsVisible == true
  ASSERT result.inputFieldIsAboveKeyboard == true
  ASSERT result.paddingBetweenInputAndKeyboard >= 100
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed component produces the same result as the original component.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalModal(input) == fixedModal(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across different input scenarios
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that modal behavior is unchanged for non-keyboard interactions
- It verifies animations and styling remain consistent

**Test Plan**: Observe behavior on UNFIXED code first for modal animations, button interactions, and non-keyboard scenarios, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Modal Animation Preservation**: Verify modal open/close animations work smoothly on unfixed code, then write test to verify this continues after fix
2. **Button Interaction Preservation**: Verify Create and Cancel buttons work correctly on unfixed code, then write test to verify this continues after fix
3. **Focus Management Preservation**: Verify focus transitions between fields work correctly on unfixed code, then write test to verify this continues after fix
4. **Keyboard Dismissal Preservation**: Verify keyboard dismissal doesn't cause layout shifts on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test that KeyboardAwareScrollView is used instead of ScrollView in both modals
- Test that extraScrollHeight is configured with appropriate value (100-150)
- Test that keyboardShouldPersistTaps="handled" is maintained
- Test that input fields are visible when focused with keyboard present
- Test that form scrolls to keep focused input visible
- Test that modal styling and animations are not affected

### Property-Based Tests

- Generate random screen sizes and verify input fields remain visible when focused
- Generate random keyboard heights and verify adequate padding is maintained
- Generate random sequences of field focus events and verify form scrolls correctly
- Generate random modal open/close sequences and verify animations work consistently

### Integration Tests

- Test full Create Department flow with keyboard interactions on small screens
- Test full Create Branch flow with keyboard interactions on small screens
- Test switching between modals and verifying keyboard behavior in each
- Test keyboard dismissal and re-appearance during form filling
- Test form submission with keyboard visible and dismissed

