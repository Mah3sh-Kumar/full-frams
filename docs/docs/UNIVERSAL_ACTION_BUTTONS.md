# Universal Action Buttons

## Overview
Standardized edit and delete button styling has been implemented across the entire FRAMS codebase for consistency and improved accessibility.

## Design Specifications

### Edit Button
- **Background Color**: `#e0e7ff` (Light blue)
- **Icon Color**: `tokens.colors.primary.main` (Blue)
- **Icon**: `pencil` (Ionicons)
- **Size**: 36x36px (accessibility compliant)
- **Border Radius**: 18px (circular)
- **Shadow**: Subtle elevation for depth

### Delete Button
- **Background Color**: `#fee2e2` (Light red)
- **Icon Color**: `tokens.colors.error.main` (Red)
- **Icon**: `trash` (Ionicons)
- **Size**: 36x36px (accessibility compliant)
- **Border Radius**: 18px (circular)
- **Shadow**: Subtle elevation for depth

## Usage

### Using the ActionButton Component

```tsx
import { ActionButton } from '../components/common/ActionButtons';

// Edit button
<ActionButton
  type="edit"
  onPress={handleEdit}
  accessibilityLabel="Edit item"
  accessibilityHint="Opens edit form"
/>

// Delete button
<ActionButton
  type="delete"
  onPress={handleDelete}
  accessibilityLabel="Delete item"
  accessibilityHint="Opens delete confirmation"
/>
```

### Using the ActionButtonsGroup Component

```tsx
import { ActionButtonsGroup } from '../components/common/ActionButtons';

<ActionButtonsGroup
  onEdit={handleEdit}
  onDelete={handleDelete}
  editAccessibilityLabel="Edit subject"
  editAccessibilityHint="Opens edit form"
  deleteAccessibilityLabel="Delete subject"
  deleteAccessibilityHint="Opens delete confirmation"
/>
```

## Files Updated

### Components
- `FRAMS/components/common/ActionButtons.tsx` (NEW)
- `FRAMS/components/admin/subjects/SubjectCard.tsx`

### Admin Screens
- `FRAMS/screens/admin/OrganizationManager.tsx`
- `FRAMS/screens/admin/UserManagement.tsx`
- `FRAMS/screens/admin/AssignSubjects.tsx`
- `FRAMS/screens/admin/VerificationDashboard.tsx`

### Teacher Screens
- `FRAMS/screens/teacher/AssignmentManager.tsx`

### Other Screens
- `FRAMS/screens/NotificationsScreen.tsx`

## Benefits

1. **Visual Consistency**: All edit/delete buttons look the same across the app
2. **Better Visibility**: Colored backgrounds make buttons more prominent
3. **Accessibility**: 36x36px size meets touch target requirements
4. **User Experience**: Clear visual feedback with shadows and colors
5. **Maintainability**: Centralized component makes updates easier

## Accessibility Features

- Minimum touch target size of 36x36px (WCAG 2.1 Level AAA)
- Clear color contrast between icon and background
- Proper accessibility labels and hints
- Consistent visual patterns for better learnability
