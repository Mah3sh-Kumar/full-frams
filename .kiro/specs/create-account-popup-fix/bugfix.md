# Create Account Popup Layout Fix

## Introduction

The Create Account screen has a visual issue in the selection popup (used for Department and Class Level selection). When the selection panel opens, the last option in the list is partially cut off or hidden at the bottom, creating an unpolished appearance. This affects both the Department picker (for teachers) and the Class Level picker (for students), making it impossible to see and select the final option without scrolling.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Department or Class Level selection popup opens with multiple options THEN the last option in the list is partially cut off or hidden at the bottom of the modal

1.2 WHEN the user scrolls to the bottom of the selection list THEN the last item appears slightly hidden or overlaps with the modal boundary

1.3 WHEN the selection popup is displayed on devices with limited screen height THEN the bottom area of the popup may overlap with system navigation space

1.4 WHEN the selection popup contains many options THEN the spacing at the bottom appears unbalanced and incomplete

### Expected Behavior (Correct)

2.1 WHEN the Department or Class Level selection popup opens THEN all options should be fully visible with proper spacing, including the last option

2.2 WHEN the user scrolls to the bottom of the selection list THEN the last item should be completely visible with adequate padding below it

2.3 WHEN the selection popup is displayed on any screen size THEN the popup should adjust properly and not overlap with system navigation space

2.4 WHEN the selection popup contains many options THEN the spacing at the bottom should look clean, balanced, and professional

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user selects an option from the popup THEN the selection should work correctly and the modal should close as before

3.2 WHEN the user searches for options in the popup THEN the search functionality should continue to work correctly

3.3 WHEN the user closes the popup by tapping the close button or outside the modal THEN the modal should close properly without affecting the form state

3.4 WHEN the popup displays selected items with icons and descriptions THEN the visual styling and layout of individual items should remain unchanged

3.5 WHEN the popup is displayed on different screen sizes THEN the modal width and overall appearance should remain consistent
