# Keyboard Obscuring Input Fields Bugfix

## Introduction

The Create Department and Create Branch modals in the Organization Manager screen have a critical usability issue where the keyboard obscures input fields when typing. This prevents users from seeing what they're typing and makes the forms unusable on mobile devices. The root cause is that the modal forms use a regular ScrollView instead of KeyboardAwareScrollView, which prevents proper scrolling when the keyboard appears.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user focuses on an input field in the Create Department modal THEN the keyboard appears and obscures the input field, making it invisible and unusable

1.2 WHEN a user focuses on an input field in the Create Branch modal THEN the keyboard appears and obscures the input field, making it invisible and unusable

1.3 WHEN a user scrolls within the modal form THEN the form does not automatically adjust to keep the focused input field visible above the keyboard

### Expected Behavior (Correct)

2.1 WHEN a user focuses on an input field in the Create Department modal THEN the keyboard appears and the form automatically scrolls to keep the input field visible above the keyboard

2.2 WHEN a user focuses on an input field in the Create Branch modal THEN the keyboard appears and the form automatically scrolls to keep the input field visible above the keyboard

2.3 WHEN a user focuses on an input field THEN there is adequate padding (extraScrollHeight) between the input field and the keyboard to ensure visibility and usability

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user interacts with non-input elements (buttons, labels, text) in the modals THEN the modal display and interaction behavior SHALL CONTINUE TO work as before

3.2 WHEN a user dismisses the keyboard THEN the form SHALL CONTINUE TO display normally without any layout shifts or visual artifacts

3.3 WHEN a user navigates between different input fields THEN the form SHALL CONTINUE TO maintain proper focus management and field validation

3.4 WHEN the modal is opened or closed THEN the modal animation and lifecycle behavior SHALL CONTINUE TO work as before
