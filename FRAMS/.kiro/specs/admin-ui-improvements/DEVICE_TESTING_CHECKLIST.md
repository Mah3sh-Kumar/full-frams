# Device Testing Checklist

## Overview

This checklist should be completed on physical Android and iOS devices to verify all features work correctly in production environments.

---

## Pre-Testing Setup

### Android Device
- [ ] Device running Android 8.0 (API 26) or higher
- [ ] Developer mode enabled
- [ ] USB debugging enabled
- [ ] Expo Go app installed OR development build
- [ ] Good lighting conditions for testing

### iOS Device
- [ ] Device running iOS 13.0 or higher
- [ ] Device registered in Apple Developer account (for development builds)
- [ ] Expo Go app installed OR development build
- [ ] Good lighting conditions for testing

### Environment
- [ ] Supabase backend is running and accessible
- [ ] Database migrations completed
- [ ] Test user accounts created (admin, teacher, student)
- [ ] Sample organizational data populated

---

## Feature 1: Keyboard-Aware Form Handling

### Test Cases

#### TC1.1: Basic Keyboard Behavior
**Platform**: Android & iOS

- [ ] Open SignUpScreen
- [ ] Tap on first input field (Name)
- [ ] **Verify**: Keyboard appears
- [ ] **Verify**: Input field remains visible above keyboard
- [ ] Tap on last input field (Password)
- [ ] **Verify**: Form scrolls to show input above keyboard
- [ ] Tap outside form to dismiss keyboard
- [ ] **Verify**: Form returns to original scroll position

#### TC1.2: Multiple Input Navigation
**Platform**: Android & iOS

- [ ] Open any form with 5+ input fields
- [ ] Tap through each input field sequentially
- [ ] **Verify**: Each field becomes visible as you focus it
- [ ] **Verify**: Smooth transitions between fields
- [ ] **Verify**: No input fields are hidden by keyboard

#### TC1.3: Keyboard Dismissal
**Platform**: Android & iOS

- [ ] Open form and focus on middle input field
- [ ] Note the scroll position
- [ ] Dismiss keyboard (tap outside or back button)
- [ ] **Verify**: Scroll position restores to original
- [ ] **Verify**: No jarring jumps or animations

#### TC1.4: Platform-Specific Behavior
**Platform**: Android

- [ ] Open form with keyboard
- [ ] **Verify**: Keyboard uses "height" behavior (form resizes)
- [ ] **Verify**: No content is permanently hidden

**Platform**: iOS

- [ ] Open form with keyboard
- [ ] **Verify**: Keyboard uses "padding" behavior (form shifts up)
- [ ] **Verify**: Smooth animation when keyboard appears/disappears

#### TC1.5: Edge Cases
**Platform**: Android & iOS

- [ ] Open form on small screen device
- [ ] Focus on last input field
- [ ] **Verify**: Field is visible with adequate spacing
- [ ] Rotate device to landscape
- [ ] **Verify**: Keyboard handling still works correctly
- [ ] Rotate back to portrait
- [ ] **Verify**: No layout issues

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

**Notes**:
```
[Add any issues or observations here]
```

---

## Feature 2: Screenshot Prevention

### Test Cases

#### TC2.1: Screenshot Prevention - Android
**Platform**: Android

- [ ] Launch app on Android device
- [ ] Navigate to any screen with sensitive data
- [ ] Attempt to take screenshot (Power + Volume Down)
- [ ] **Verify**: Screenshot is blocked (black screen or error)
- [ ] **Verify**: No error message shown to user
- [ ] Check screenshot in gallery
- [ ] **Verify**: Screenshot is blank or not saved

#### TC2.2: Screenshot Prevention - iOS
**Platform**: iOS

- [ ] Launch app on iOS device
- [ ] Navigate to any screen with sensitive data
- [ ] Attempt to take screenshot (Power + Volume Up)
- [ ] **Verify**: Screenshot is blocked or shows blank screen
- [ ] **Verify**: No error message shown to user
- [ ] Check screenshot in Photos app
- [ ] **Verify**: Screenshot is blank or not saved

#### TC2.3: Screen Recording Prevention - Android
**Platform**: Android

- [ ] Start screen recording (Quick Settings)
- [ ] Open app
- [ ] Navigate through several screens
- [ ] Stop recording
- [ ] **Verify**: Recording shows blank screen or is blocked
- [ ] **Verify**: No error messages during recording

#### TC2.4: Screen Recording Prevention - iOS
**Platform**: iOS

- [ ] Start screen recording (Control Center)
- [ ] Open app
- [ ] Navigate through several screens
- [ ] Stop recording
- [ ] **Verify**: Recording shows blank screen or is blocked
- [ ] **Verify**: No error messages during recording

#### TC2.5: Background State Prevention
**Platform**: Android & iOS

- [ ] Open app
- [ ] Press home button (app goes to background)
- [ ] Open recent apps/multitasking view
- [ ] **Verify**: App preview is blank or obscured
- [ ] Return to app
- [ ] **Verify**: App functions normally

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

**Notes**:
```
[Add any issues or observations here]
```

---

## Feature 3: Enhanced Dropdown Picker

### Test Cases

#### TC3.1: Value Display
**Platform**: Android & iOS

- [ ] Open SignUpScreen
- [ ] Select a class from Class dropdown
- [ ] **Verify**: Selected class name displays in field
- [ ] Select a branch from Branch dropdown
- [ ] **Verify**: Selected branch name displays in field
- [ ] Select a department from Department dropdown
- [ ] **Verify**: Selected department name displays in field

#### TC3.2: Selection Persistence
**Platform**: Android & iOS

- [ ] Fill out signup form with all dropdowns
- [ ] Submit form (or save draft if available)
- [ ] Navigate away and return to form
- [ ] **Verify**: All dropdown values are still displayed correctly
- [ ] **Verify**: Values match what was selected

#### TC3.3: Search Functionality
**Platform**: Android & iOS

- [ ] Open dropdown with >10 items
- [ ] **Verify**: Search field appears automatically
- [ ] Type search query (e.g., "Grade")
- [ ] **Verify**: List filters to matching items only
- [ ] Clear search
- [ ] **Verify**: Full list returns
- [ ] Select an item from filtered list
- [ ] **Verify**: Selection works correctly

#### TC3.4: Visual Feedback
**Platform**: Android & iOS

- [ ] Open any dropdown
- [ ] **Verify**: Modal opens with smooth animation
- [ ] Tap an item
- [ ] **Verify**: Item highlights immediately
- [ ] **Verify**: Checkmark appears next to selected item
- [ ] **Verify**: Modal closes smoothly
- [ ] **Verify**: Selected value displays in field

#### TC3.5: Error States
**Platform**: Android & iOS

- [ ] Submit form without selecting required dropdown
- [ ] **Verify**: Error message appears below dropdown
- [ ] **Verify**: Dropdown border turns red
- [ ] Select a value
- [ ] **Verify**: Error message disappears
- [ ] **Verify**: Border returns to normal color

#### TC3.6: Accessibility
**Platform**: Android & iOS

- [ ] Enable screen reader (TalkBack/VoiceOver)
- [ ] Navigate to dropdown
- [ ] **Verify**: Screen reader announces "picker" role
- [ ] **Verify**: Label is read correctly
- [ ] Open dropdown
- [ ] **Verify**: Items are announced as you navigate
- [ ] **Verify**: Selected state is announced
- [ ] Disable screen reader

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

**Notes**:
```
[Add any issues or observations here]
```

---

## Feature 4: Organization Management

### Test Cases

#### TC4.1: Create Operations
**Platform**: Android & iOS

- [ ] Login as admin user
- [ ] Navigate to Organization Manager
- [ ] Switch to Classes tab
- [ ] Tap create button (+)
- [ ] **Verify**: Modal opens with form
- [ ] Enter class name and value
- [ ] Tap Create
- [ ] **Verify**: Success message appears
- [ ] **Verify**: New class appears in list
- [ ] Repeat for Branches and Departments tabs

#### TC4.2: Edit Operations
**Platform**: Android & iOS

- [ ] Open Organization Manager
- [ ] Tap edit button on any item
- [ ] **Verify**: Modal opens with pre-filled data
- [ ] Modify the name
- [ ] Tap Update
- [ ] **Verify**: Success message appears
- [ ] **Verify**: Updated name displays in list

#### TC4.3: Delete Operations
**Platform**: Android & iOS

- [ ] Create a test class with no users
- [ ] Tap delete button on test class
- [ ] **Verify**: Confirmation dialog appears
- [ ] Tap Confirm
- [ ] **Verify**: Success message appears
- [ ] **Verify**: Item removed from list

#### TC4.4: Deletion Prevention
**Platform**: Android & iOS

- [ ] Create a class and assign it to a user
- [ ] Attempt to delete the class
- [ ] **Verify**: Error message about item being in use
- [ ] **Verify**: Item remains in list
- [ ] **Verify**: Error message is clear and helpful

#### TC4.5: Branch-Class Association
**Platform**: Android & iOS

- [ ] Open Organization Manager → Branches tab
- [ ] Create a new branch
- [ ] Select a specific class from dropdown
- [ ] Save branch
- [ ] Open SignUpScreen
- [ ] Select the class you associated
- [ ] Open Branch dropdown
- [ ] **Verify**: Only branches for that class appear
- [ ] **Verify**: Branches for other classes don't appear

#### TC4.6: Real-time Updates
**Platform**: Android & iOS

- [ ] Open Organization Manager
- [ ] Create a new department
- [ ] Navigate to SignUpScreen (don't close app)
- [ ] Open Department dropdown
- [ ] **Verify**: New department appears in list
- [ ] Return to Organization Manager
- [ ] Edit the department name
- [ ] Return to SignUpScreen
- [ ] **Verify**: Updated name appears in dropdown

#### TC4.7: Loading States
**Platform**: Android & iOS

- [ ] Open Organization Manager
- [ ] **Verify**: Loading spinner appears while fetching data
- [ ] **Verify**: Spinner disappears when data loads
- [ ] Create a new item
- [ ] **Verify**: Button shows loading state during save
- [ ] **Verify**: Button returns to normal after save

#### TC4.8: Empty States
**Platform**: Android & iOS

- [ ] Create a fresh database or clear all items
- [ ] Open Organization Manager
- [ ] **Verify**: Empty state message appears
- [ ] **Verify**: Message is helpful and clear
- [ ] **Verify**: Create button is still accessible

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

**Notes**:
```
[Add any issues or observations here]
```

---

## Integration Tests

### Test Cases

#### INT1: Complete Admin Workflow
**Platform**: Android & iOS

- [ ] Login as admin
- [ ] Create a new class "Test Class"
- [ ] Create a new branch "Test Branch" for "Test Class"
- [ ] Navigate to SignUpScreen
- [ ] Select "Test Class" from dropdown
- [ ] **Verify**: "Test Branch" appears in Branch dropdown
- [ ] Complete signup with test data
- [ ] Return to Organization Manager
- [ ] Attempt to delete "Test Class"
- [ ] **Verify**: Deletion prevented (user exists)
- [ ] Delete the test user
- [ ] Delete "Test Branch"
- [ ] Delete "Test Class"
- [ ] **Verify**: All deletions successful

#### INT2: Form Keyboard + Dropdown Integration
**Platform**: Android & iOS

- [ ] Open SignUpScreen
- [ ] Focus on Name input (keyboard appears)
- [ ] Scroll down and tap Class dropdown
- [ ] **Verify**: Keyboard dismisses
- [ ] **Verify**: Dropdown modal opens correctly
- [ ] Select a class
- [ ] **Verify**: Modal closes
- [ ] Focus on next input field
- [ ] **Verify**: Keyboard appears and form scrolls correctly

#### INT3: Multi-User Scenario
**Platform**: Android & iOS

- [ ] Create organizational data as admin
- [ ] Logout
- [ ] Login as teacher
- [ ] Navigate to form with dropdowns
- [ ] **Verify**: Can see organizational data
- [ ] **Verify**: Cannot modify organizational data
- [ ] Logout
- [ ] Login as student
- [ ] **Verify**: Can see organizational data in profile
- [ ] **Verify**: Cannot access Organization Manager

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

**Notes**:
```
[Add any issues or observations here]
```

---

## Performance Tests

### Test Cases

#### PERF1: Dropdown Performance
**Platform**: Android & iOS

- [ ] Create 100+ items in a dropdown
- [ ] Open the dropdown
- [ ] **Measure**: Time to open (should be <500ms)
- [ ] Scroll through list
- [ ] **Verify**: Smooth scrolling (60fps)
- [ ] Search for items
- [ ] **Verify**: Search results appear quickly (<300ms)

#### PERF2: Organization Manager Performance
**Platform**: Android & iOS

- [ ] Create 50+ classes, branches, and departments
- [ ] Open Organization Manager
- [ ] **Measure**: Time to load (should be <2s)
- [ ] Switch between tabs
- [ ] **Verify**: Tab switching is instant
- [ ] Scroll through lists
- [ ] **Verify**: Smooth scrolling

#### PERF3: Form Performance
**Platform**: Android & iOS

- [ ] Open form with multiple dropdowns
- [ ] Rapidly switch between input fields
- [ ] **Verify**: No lag or stuttering
- [ ] Open and close dropdowns quickly
- [ ] **Verify**: Animations remain smooth
- [ ] Fill out entire form
- [ ] **Verify**: No performance degradation

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

**Notes**:
```
[Add any issues or observations here]
```

---

## Accessibility Tests

### Test Cases

#### A11Y1: Screen Reader Navigation
**Platform**: Android (TalkBack)

- [ ] Enable TalkBack
- [ ] Navigate through Organization Manager
- [ ] **Verify**: All buttons are announced
- [ ] **Verify**: List items are announced with names
- [ ] **Verify**: Tab labels are clear
- [ ] Open dropdown
- [ ] **Verify**: Items are navigable with swipe gestures
- [ ] **Verify**: Selected state is announced

**Platform**: iOS (VoiceOver)

- [ ] Enable VoiceOver
- [ ] Navigate through Organization Manager
- [ ] **Verify**: All buttons are announced
- [ ] **Verify**: List items are announced with names
- [ ] **Verify**: Tab labels are clear
- [ ] Open dropdown
- [ ] **Verify**: Items are navigable with swipe gestures
- [ ] **Verify**: Selected state is announced

#### A11Y2: Touch Target Sizes
**Platform**: Android & iOS

- [ ] Measure all interactive elements
- [ ] **Verify**: All buttons are at least 44x44 points
- [ ] **Verify**: Dropdown items are at least 44 points tall
- [ ] **Verify**: Easy to tap without mistakes

#### A11Y3: Color Contrast
**Platform**: Android & iOS

- [ ] Check all text against backgrounds
- [ ] **Verify**: Contrast ratio meets WCAG AA (4.5:1 for normal text)
- [ ] **Verify**: Error states are distinguishable
- [ ] **Verify**: Selected states are clear

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

**Notes**:
```
[Add any issues or observations here]
```

---

## Edge Cases & Error Scenarios

### Test Cases

#### EDGE1: Network Failures
**Platform**: Android & iOS

- [ ] Enable airplane mode
- [ ] Attempt to create organizational item
- [ ] **Verify**: Appropriate error message
- [ ] **Verify**: App doesn't crash
- [ ] Disable airplane mode
- [ ] Retry operation
- [ ] **Verify**: Operation succeeds

#### EDGE2: Slow Network
**Platform**: Android & iOS

- [ ] Throttle network to 3G speeds
- [ ] Open Organization Manager
- [ ] **Verify**: Loading states appear
- [ ] **Verify**: Data eventually loads
- [ ] **Verify**: No timeout errors

#### EDGE3: Large Data Sets
**Platform**: Android & iOS

- [ ] Create 200+ organizational items
- [ ] Open Organization Manager
- [ ] **Verify**: App remains responsive
- [ ] **Verify**: Lists load completely
- [ ] Search through large list
- [ ] **Verify**: Search works correctly

#### EDGE4: Special Characters
**Platform**: Android & iOS

- [ ] Create items with special characters (é, ñ, 中文)
- [ ] **Verify**: Characters display correctly
- [ ] **Verify**: Search works with special characters
- [ ] **Verify**: No encoding issues

#### EDGE5: Memory Pressure
**Platform**: Android & iOS

- [ ] Open multiple apps in background
- [ ] Return to FRAMS app
- [ ] **Verify**: App resumes correctly
- [ ] **Verify**: Data is still loaded
- [ ] **Verify**: No crashes

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

**Notes**:
```
[Add any issues or observations here]
```

---

## Sign-Off

### Android Testing

**Device Model**: _________________
**Android Version**: _________________
**Tester Name**: _________________
**Date**: _________________
**Overall Status**: ⬜ Pass | ⬜ Pass with Issues | ⬜ Fail

**Critical Issues Found**:
```
[List any critical issues that must be fixed]
```

**Minor Issues Found**:
```
[List any minor issues or improvements]
```

### iOS Testing

**Device Model**: _________________
**iOS Version**: _________________
**Tester Name**: _________________
**Date**: _________________
**Overall Status**: ⬜ Pass | ⬜ Pass with Issues | ⬜ Fail

**Critical Issues Found**:
```
[List any critical issues that must be fixed]
```

**Minor Issues Found**:
```
[List any minor issues or improvements]
```

---

## Testing Summary

**Total Test Cases**: 50+
**Passed**: ___ / ___
**Failed**: ___ / ___
**Blocked**: ___ / ___

**Recommendation**: ⬜ Approve for Production | ⬜ Needs Fixes | ⬜ Major Rework Required

**Additional Notes**:
```
[Add any additional observations, recommendations, or concerns]
```

---

*This checklist should be completed before deploying to production.*
*All critical issues must be resolved before release.*
